import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverPackages, expandPackageGlobs, getFixedGroupPackages, readChangesetConfig } from './discovery.js';

vi.mock('node:fs');

describe('discovery', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readChangesetConfig', () => {
    it('throws when config file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(readChangesetConfig()).rejects.toThrow('Changeset config not found at .changeset/config.json');
    });

    it('reads and parses config file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ fixed: [['@scope/*']] }));

      const result = await readChangesetConfig('custom/path.json');
      expect(result).toEqual({ fixed: [['@scope/*']] });
    });

    it('throws on invalid JSON', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('not valid json');

      await expect(readChangesetConfig()).rejects.toThrow('Failed to read changeset config:');
    });
  });

  describe('discoverPackages', () => {
    it('reads config and expands glob patterns', async () => {
      vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path);
        return (
          pathStr.includes('config.json') || pathStr.endsWith('/packages') || pathStr.includes('/pkg-a/package.json')
        );
      });
      vi.mocked(fs.readFileSync).mockImplementation((path: fs.PathOrFileDescriptor) => {
        const pathStr = String(path);
        if (pathStr.includes('config.json')) return JSON.stringify({ fixed: [['@auto/*']] });
        return JSON.stringify({ name: '@auto/pkg-a' });
      });
      vi.mocked(fs.readdirSync).mockReturnValue([{ name: 'pkg-a', isDirectory: () => true } as fs.Dirent]);

      const result = await discoverPackages();
      expect(result).toEqual(['@auto/pkg-a']);
    });
  });

  describe('getFixedGroupPackages', () => {
    it('returns empty array when fixed is undefined', () => {
      const result = getFixedGroupPackages({});
      expect(result).toEqual([]);
    });

    it('returns empty array when fixed is empty', () => {
      const result = getFixedGroupPackages({ fixed: [] });
      expect(result).toEqual([]);
    });

    it('flattens fixed groups into single array', () => {
      const result = getFixedGroupPackages({
        fixed: [['@scope/pkg-a', '@scope/pkg-b'], ['pkg-c']],
      });
      expect(result).toEqual(['@scope/pkg-a', '@scope/pkg-b', 'pkg-c']);
    });
  });

  describe('expandPackageGlobs', () => {
    it('returns non-glob patterns as-is when packages dir does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = expandPackageGlobs(['@scope/pkg-a', 'pkg-b']);
      expect(result).toEqual(['@scope/pkg-a', 'pkg-b']);
    });

    it('filters out glob patterns when packages dir does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = expandPackageGlobs(['@scope/*', 'pkg-b']);
      expect(result).toEqual(['pkg-b']);
    });

    it('expands glob patterns to matching package names', () => {
      vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path);
        return (
          pathStr.endsWith('/packages') ||
          pathStr.includes('/pkg-a/package.json') ||
          pathStr.includes('/pkg-b/package.json')
        );
      });
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'pkg-a', isDirectory: () => true } as fs.Dirent,
        { name: 'pkg-b', isDirectory: () => true } as fs.Dirent,
      ]);
      vi.mocked(fs.readFileSync).mockImplementation((path: fs.PathOrFileDescriptor) => {
        const pathStr = String(path);
        if (pathStr.includes('/pkg-a/')) return JSON.stringify({ name: '@auto/pkg-a' });
        if (pathStr.includes('/pkg-b/')) return JSON.stringify({ name: '@auto/pkg-b' });
        return '{}';
      });

      const result = expandPackageGlobs(['@auto/*']);
      expect(result).toEqual(['@auto/pkg-a', '@auto/pkg-b']);
    });

    it('includes non-glob patterns alongside expanded globs', () => {
      vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path);
        return pathStr.endsWith('/packages') || pathStr.includes('/pkg-a/package.json');
      });
      vi.mocked(fs.readdirSync).mockReturnValue([{ name: 'pkg-a', isDirectory: () => true } as fs.Dirent]);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: '@auto/pkg-a' }));

      const result = expandPackageGlobs(['@auto/*', 'standalone-pkg']);
      expect(result).toEqual(['@auto/pkg-a', 'standalone-pkg']);
    });

    it('deduplicates results', () => {
      vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path);
        return pathStr.endsWith('/packages') || pathStr.includes('/pkg-a/package.json');
      });
      vi.mocked(fs.readdirSync).mockReturnValue([{ name: 'pkg-a', isDirectory: () => true } as fs.Dirent]);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: '@auto/pkg-a' }));

      const result = expandPackageGlobs(['@auto/*', '@auto/pkg-a']);
      expect(result).toEqual(['@auto/pkg-a']);
    });

    it('skips non-directory entries', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'file.txt', isDirectory: () => false } as fs.Dirent,
        { name: 'pkg-a', isDirectory: () => true } as fs.Dirent,
      ]);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: '@auto/pkg-a' }));

      const result = expandPackageGlobs(['@auto/*']);
      expect(result).toEqual(['@auto/pkg-a']);
    });

    it('skips directories without package.json', () => {
      vi.mocked(fs.existsSync).mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path);
        return pathStr.endsWith('/packages');
      });
      vi.mocked(fs.readdirSync).mockReturnValue([{ name: 'empty-dir', isDirectory: () => true } as fs.Dirent]);

      const result = expandPackageGlobs(['@auto/*']);
      expect(result).toEqual([]);
    });

    it('skips packages with invalid package.json', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([{ name: 'broken', isDirectory: () => true } as fs.Dirent]);
      vi.mocked(fs.readFileSync).mockReturnValue('not valid json');

      const result = expandPackageGlobs(['@auto/*']);
      expect(result).toEqual([]);
    });

    it('skips packages without name field', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([{ name: 'no-name', isDirectory: () => true } as fs.Dirent]);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.0.0' }));

      const result = expandPackageGlobs(['@auto/*']);
      expect(result).toEqual([]);
    });
  });
});
