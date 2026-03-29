import { join } from 'node:path';
import { ConnectionManager } from '../connection.js';
import { ModelPersistence } from '../persistence.js';
import { getConfigDir } from '../config.js';

export interface Daemon {
  connection: ConnectionManager;
  persistence: ModelPersistence;
}

export async function startDaemon(config: {
  apiKey: string;
  serverUrl: string;
  workspaceId: string;
}): Promise<Daemon> {
  const configDir = getConfigDir();
  const modelPath = join(configDir, 'model.json');
  const persistence = new ModelPersistence(modelPath);

  const connection = new ConnectionManager({
    serverUrl: config.serverUrl,
    apiKey: config.apiKey,
    workspaceId: config.workspaceId,
    persistence,
  });

  await connection.connect();

  return { connection, persistence };
}
