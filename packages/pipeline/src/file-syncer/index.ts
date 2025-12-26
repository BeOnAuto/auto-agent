import path from 'node:path';
import { NodeFileStore } from '@auto-engineer/file-store/node';
import chokidar from 'chokidar';
import type { Response } from 'express';
import { createJWE } from './crypto/jwe-encryptor';
import { getActiveProvider, getProviderEnvHash } from './crypto/provider-resolver';
import { resolveSyncFileSet } from './sync/resolveSyncFileSet';
import type { WireChange, WireInitial } from './types/wire';
import { md5, readBase64, statSize } from './utils/hash';
import { fromWirePath, rebuildWirePathCache, toWirePath } from './utils/path';

type FileMeta = { hash: string; size: number };

interface FileSyncSSEClient {
  id: string;
  response: Response;
}

export interface FileSyncerConfig {
  watchDir: string;
  projectRoot?: string;
  loadAutoConfig?: (configPath: string) => Promise<unknown>;
}

async function processFileForChange(
  abs: string,
  vfs: NodeFileStore,
  active: Map<string, FileMeta>,
  projectRoot: string,
): Promise<WireChange | null> {
  const hash = await md5(vfs, abs);
  if (hash === null) return null;

  const size = await statSize(vfs, abs);
  const prev = active.get(abs);

  if (prev && prev.hash === hash && prev.size === size) {
    return null;
  }

  const content = await readBase64(vfs, abs);
  if (content === null) return null;

  active.set(abs, { hash, size });
  const wire = toWirePath(abs, projectRoot);
  return { event: prev ? 'change' : 'add', path: wire, content };
}

export class FileSyncer {
  private watchDir: string;
  private projectRoot: string;
  private vfs: NodeFileStore;
  private active: Map<string, FileMeta>;
  private watcher?: chokidar.FSWatcher;
  private debounce: NodeJS.Timeout | null = null;
  private autoConfigDebounce: NodeJS.Timeout | null = null;
  private lastComputeTime: number = 0;
  private cachedDesiredSet: Set<string> | null = null;
  private autoConfigHash: string | null = null;
  private autoConfigContent: unknown = null;
  private providerEnvHash: string | null = null;
  private clients: Map<string, FileSyncSSEClient> = new Map();
  private loadAutoConfig?: (configPath: string) => Promise<unknown>;

  constructor(config: FileSyncerConfig) {
    this.watchDir = path.resolve(config.watchDir);
    this.projectRoot = config.projectRoot ?? path.dirname(this.watchDir);
    this.vfs = new NodeFileStore();
    this.active = new Map<string, FileMeta>();
    this.loadAutoConfig = config.loadAutoConfig;
  }

  private broadcast(eventName: string, data: unknown): void {
    const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    const failedClientIds: string[] = [];

    for (const client of this.clients.values()) {
      try {
        client.response.write(message);
      } catch {
        failedClientIds.push(client.id);
      }
    }

    for (const id of failedClientIds) {
      this.removeClient(id);
    }
  }

  addClient(id: string, response: Response): void {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    response.write(':\n\n');

    this.clients.set(id, { id, response });

    response.on('close', () => {
      this.removeClient(id);
    });

    void this.sendInitialSync(response);
  }

  removeClient(id: string): void {
    const client = this.clients.get(id);
    if (client !== undefined) {
      client.response.end();
      this.clients.delete(id);
    }
  }

  private async sendInitialSync(response: Response): Promise<void> {
    try {
      const init = await this.computeInitialFiles();
      const files = Array.from(this.active.keys()).map((abs) => ({ abs, projectRoot: this.projectRoot }));
      rebuildWirePathCache(files);
      const message = `event: initial-sync\ndata: ${JSON.stringify(init)}\n\n`;
      response.write(message);
    } catch {
      // error sending initial sync
    }
  }

  async getInitialFiles(): Promise<WireInitial> {
    return this.computeInitialFiles();
  }

  start(): void {
    const compute = async (): Promise<Set<string>> => {
      const now = Date.now();
      if (this.cachedDesiredSet && now - this.lastComputeTime < 1000) {
        return this.cachedDesiredSet;
      }

      const result = await resolveSyncFileSet({
        vfs: this.vfs,
        watchDir: this.watchDir,
        projectRoot: this.projectRoot,
      });
      this.cachedDesiredSet = result;
      this.lastComputeTime = now;
      return result;
    };

    const computeChanges = async (desired: Set<string>): Promise<WireChange[]> => {
      const outgoing: WireChange[] = [];
      for (const abs of desired) {
        const change = await processFileForChange(abs, this.vfs, this.active, this.projectRoot);
        if (change !== null) {
          outgoing.push(change);
        }
      }
      return outgoing;
    };

    const computeDeletions = (desired: Set<string>): WireChange[] => {
      const toDelete: WireChange[] = [];
      for (const abs of Array.from(this.active.keys())) {
        if (!desired.has(abs)) {
          this.active.delete(abs);
          const wire = toWirePath(abs, this.projectRoot);
          toDelete.push({ event: 'delete', path: wire });
        }
      }
      return toDelete;
    };

    const handleEmptyTransition = (desired: Set<string>, toDelete: WireChange[]): boolean => {
      if (this.active.size === 0 && desired.size === 0 && toDelete.length > 0) {
        this.broadcast('initial-sync', { files: [], directory: path.resolve(this.watchDir) });
        return true;
      }
      return false;
    };

    const handleRehydration = (activeSizeBefore: number, outgoing: WireChange[], desired: Set<string>): boolean => {
      const allAdds = outgoing.length > 0 && outgoing.every((x) => x.event === 'add');
      const rehydrateFromEmpty = activeSizeBefore === 0 && allAdds && desired.size === outgoing.length;

      if (rehydrateFromEmpty) {
        const files = outgoing
          .map((o) => ({ path: o.path, content: o.content! }))
          .sort((a, b) => a.path.localeCompare(b.path));
        this.broadcast('initial-sync', { files, directory: path.resolve(this.watchDir) });
        return true;
      }
      return false;
    };

    const rebuildAndBroadcast = async (): Promise<void> => {
      const desired = await compute();
      const activeSizeBefore = this.active.size;
      const outgoing = await computeChanges(desired);
      const toDelete = computeDeletions(desired);

      for (const ch of toDelete) {
        this.broadcast('file-change', ch);
      }

      if (handleEmptyTransition(desired, toDelete)) return;
      if (handleRehydration(activeSizeBefore, outgoing, desired)) return;

      for (const ch of outgoing) {
        this.broadcast('file-change', ch);
      }
    };

    const scheduleRebuild = (): void => {
      if (this.debounce) clearTimeout(this.debounce);
      this.debounce = setTimeout(() => {
        this.debounce = null;
        rebuildAndBroadcast().catch(() => {});
      }, 100);
    };

    const checkAndSyncAutoConfig = async (): Promise<void> => {
      try {
        const autoConfigPath = await this.findAutoConfigFile();
        if (autoConfigPath === null) {
          this.handleAutoConfigRemoval();
          return;
        }

        const shouldUpdate = await this.shouldUpdateAutoConfig(autoConfigPath);
        if (!shouldUpdate) return;

        await this.updateAndBroadcastAutoConfig(autoConfigPath);
      } catch {
        // auto-config error
      }
    };

    const scheduleAutoConfigSync = (): void => {
      if (this.autoConfigDebounce) clearTimeout(this.autoConfigDebounce);
      this.autoConfigDebounce = setTimeout(() => {
        this.autoConfigDebounce = null;
        checkAndSyncAutoConfig().catch(() => {});
      }, 100);
    };

    const isAutoConfigFile = (filePath: string): boolean => {
      const fileName = path.basename(filePath);
      return fileName === 'auto.config.ts' || fileName === 'auto.config.js';
    };

    this.watcher = chokidar.watch([this.watchDir], {
      ignoreInitial: true,
      persistent: true,
      ignored: ['**/node_modules/**', '**/.git/**', '**/.DS_Store'],
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
    });
    this.watcher
      .on('add', (filePath) => {
        scheduleRebuild();
        if (isAutoConfigFile(filePath)) {
          scheduleAutoConfigSync();
        }
      })
      .on('change', (filePath) => {
        scheduleRebuild();
        if (isAutoConfigFile(filePath)) {
          scheduleAutoConfigSync();
        }
      })
      .on('unlink', (filePath) => {
        scheduleRebuild();
        if (isAutoConfigFile(filePath)) {
          scheduleAutoConfigSync();
        }
      })
      .on('addDir', () => {
        scheduleRebuild();
      })
      .on('unlinkDir', () => {
        scheduleRebuild();
      });

    scheduleAutoConfigSync();
  }

  private handleAutoConfigRemoval(): void {
    if (this.autoConfigContent !== null) {
      const virtualPath = path.join(this.watchDir, 'auto.config.json');
      const virtualWirePath = toWirePath(virtualPath, this.projectRoot);
      this.broadcast('file-change', { event: 'delete', path: virtualWirePath });
      this.autoConfigContent = null;
      this.autoConfigHash = null;
      this.providerEnvHash = null;
    }
  }

  private async shouldUpdateAutoConfig(autoConfigPath: string): Promise<boolean> {
    const currentHash = await md5(this.vfs, autoConfigPath);
    const currentProviderEnvHash = getProviderEnvHash();
    const configChanged = currentHash !== null && currentHash !== this.autoConfigHash;
    const envChanged = currentProviderEnvHash !== this.providerEnvHash;
    return configChanged || envChanged;
  }

  private async updateAndBroadcastAutoConfig(autoConfigPath: string): Promise<void> {
    if (!this.loadAutoConfig) return;

    const config = await this.loadAutoConfig(autoConfigPath);
    const wasPresent = this.autoConfigContent !== null;
    this.autoConfigContent = config;
    this.autoConfigHash = await md5(this.vfs, autoConfigPath);
    this.providerEnvHash = getProviderEnvHash();

    const serializedConfig = await this.serializeConfig(config);
    const virtualContent = Buffer.from(serializedConfig, 'utf8').toString('base64');
    const virtualPath = path.join(this.watchDir, 'auto.config.json');
    const virtualWirePath = toWirePath(virtualPath, this.projectRoot);
    const eventType: WireChange['event'] = wasPresent ? 'change' : 'add';
    this.broadcast('file-change', {
      event: eventType,
      path: virtualWirePath,
      content: virtualContent,
    });
  }

  async handleClientFileChange(msg: { event: 'write' | 'delete'; path: string; content?: string }): Promise<void> {
    const abs = fromWirePath(msg.path, this.projectRoot);
    const virtualAbs = path.join(this.watchDir, 'auto.config.json');
    if (path.resolve(abs) === path.resolve(virtualAbs)) {
      return;
    }
    const allowedRoot = path.resolve(this.watchDir) + path.sep;
    const normalizedAbs = path.resolve(abs);
    if (!normalizedAbs.startsWith(allowedRoot)) {
      return;
    }

    try {
      if (msg.event === 'delete') {
        await this.vfs.remove(normalizedAbs);
        this.active.delete(normalizedAbs);
      } else {
        const contentStr = msg.content;
        if (contentStr === undefined) {
          return;
        }
        const content = Buffer.from(contentStr, 'base64');
        await this.vfs.write(normalizedAbs, new Uint8Array(content));
      }
    } catch {
      // file change error
    }
  }

  stop(): void {
    if (this.watcher) {
      void this.watcher.close();
    }
    if (this.debounce) {
      clearTimeout(this.debounce);
    }
    if (this.autoConfigDebounce) {
      clearTimeout(this.autoConfigDebounce);
    }
    for (const client of this.clients.values()) {
      client.response.end();
    }
    this.clients.clear();
  }

  private async findAutoConfigFile(): Promise<string | null> {
    const candidates = [path.join(this.watchDir, 'auto.config.ts'), path.join(this.watchDir, 'auto.config.js')];

    for (const candidate of candidates) {
      try {
        const exists = await this.vfs.exists(candidate);
        if (exists) {
          return candidate;
        }
      } catch {
        // Ignore errors
      }
    }

    return null;
  }

  private async serializeConfig(cfg: unknown): Promise<string> {
    let configWithCreds: unknown = cfg;

    try {
      const active = getActiveProvider();
      if (active !== null) {
        const configWithFileId = cfg as { fileId: string };
        const jwe = await createJWE({
          provider: active.provider,
          apiKey: active.apiKey,
          model: active.model,
          custom: active.provider === 'custom' ? active.custom : undefined,
          roomId: configWithFileId.fileId,
        });
        if (typeof cfg === 'object' && cfg !== null) {
          configWithCreds = {
            ...cfg,
            token: jwe,
          };
        }
      }
    } catch {
      // continue without encryption
    }

    return JSON.stringify(
      configWithCreds,
      (_key: string, value: unknown) => {
        if (typeof value === 'function') {
          const funcName = (value as { name?: string }).name;
          return `[Function: ${funcName != null ? funcName : 'anonymous'}]`;
        }
        return value;
      },
      2,
    );
  }

  private async computeInitialFiles(): Promise<WireInitial> {
    const desired = await resolveSyncFileSet({
      vfs: this.vfs,
      watchDir: this.watchDir,
      projectRoot: this.projectRoot,
    });

    const files: WireInitial['files'] = [];
    for (const abs of desired) {
      const content = await readBase64(this.vfs, abs);
      if (content === null) {
        continue;
      }
      const wire = toWirePath(abs, this.projectRoot);
      const size = await statSize(this.vfs, abs);
      const hash = await md5(this.vfs, abs);
      if (hash === null) {
        continue;
      }
      this.active.set(abs, { hash, size });
      files.push({ path: wire, content });
    }

    if (this.autoConfigContent !== null) {
      const serializedConfig = await this.serializeConfig(this.autoConfigContent);
      const virtualContent = Buffer.from(serializedConfig, 'utf8').toString('base64');
      const virtualPath = path.join(this.watchDir, 'auto.config.json');
      files.push({ path: toWirePath(virtualPath, this.projectRoot), content: virtualContent });
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    return { files, directory: path.resolve(this.watchDir) };
  }
}

export { createJWE, type TokenPayload } from './crypto/jwe-encryptor';
export { type ActiveProvider, AIProvider, getActiveProvider, getProviderEnvHash } from './crypto/provider-resolver';
export type { WireChange, WireInitial } from './types/wire';
