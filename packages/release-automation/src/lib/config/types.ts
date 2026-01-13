import type { ReleaseConfig } from '../../types/index.js';

export type { ReleaseConfig };

export interface ConfigFile {
  releaseAutomation?: Partial<ReleaseConfig>;
}
