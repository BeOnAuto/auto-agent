import createJiti from 'jiti';

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

let configLoading = false;

export async function loadAutoConfig(configPath: string): Promise<AutoConfig> {
  if (configLoading) {
    return { fileId: '', plugins: [] };
  }

  try {
    configLoading = true;

    const jiti = createJiti(import.meta.url, {
      interopDefault: true,
      moduleCache: false,
    });

    const configModule = await jiti.import<{ default?: AutoConfig } & AutoConfig>(configPath);
    return configModule.default ?? configModule;
  } catch (error) {
    console.error('Failed to load config:', error);
    throw error;
  } finally {
    configLoading = false;
  }
}
