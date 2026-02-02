import createJiti from 'jiti';

const DEFAULT_FILE_SYNC_DIR = 'narratives';

export interface AutoConfig {
  fileId?: string;
  plugins?: string[];
  root?: string;
  fileSync?: {
    enabled?: boolean;
    dir?: string;
    extensions?: string[];
  };
  token?: string;
}

export interface ResolvedAutoConfig extends Omit<AutoConfig, 'fileSync'> {
  fileSync: {
    enabled?: boolean;
    dir: string;
    extensions?: string[];
  };
}

let configLoading = false;

export async function loadAutoConfig(configPath: string): Promise<ResolvedAutoConfig> {
  if (configLoading) {
    return { fileId: '', plugins: [], fileSync: { dir: DEFAULT_FILE_SYNC_DIR } };
  }

  try {
    configLoading = true;

    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
      moduleCache: false,
    });

    const configModule = await jiti.import<{ default?: AutoConfig } & AutoConfig>(configPath);
    const config = configModule.default ?? configModule;
    return {
      ...config,
      fileSync: {
        ...config.fileSync,
        dir: config.fileSync?.dir ?? DEFAULT_FILE_SYNC_DIR,
      },
    };
  } catch (error) {
    console.error('Failed to load config:', error);
    throw error;
  } finally {
    configLoading = false;
  }
}
