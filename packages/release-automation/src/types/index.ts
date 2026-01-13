export interface ConventionalCommit {
  hash: string;
  type: CommitType;
  scope?: string;
  subject: string;
  body: string;
  breaking: boolean;
  fullMessage: string;
}

export type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

export type BumpType = 'major' | 'minor' | 'patch';

export interface ChangesetData {
  bumpType: BumpType;
  commits: ConventionalCommit[];
  description: string;
}

export interface PackageInfo {
  name: string;
  version: string;
  path: string;
}

export interface ReleaseConfig {
  /** Path to changeset config (default: .changeset/config.json) */
  changesetConfigPath: string;

  /** Changelog generation provider */
  changelogProvider: 'claude-cli' | 'anthropic-api' | 'simple' | 'auto';

  /** Anthropic API key (if using anthropic-api provider) */
  anthropicApiKey?: string;

  /** Custom package discovery (overrides changeset config) */
  packages?: string[];

  /** Git reference to compare against (default: auto-detect) */
  since?: string;

  /** Enable/disable auto-amend in pre-push hook */
  autoAmend: boolean;

  /** Changeset directory (default: .changeset) */
  changesetDir: string;
}

export interface ChangelogProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(commits: ConventionalCommit[]): Promise<string>;
}

export interface GitCommitRange {
  since: string;
  until: string;
}

export interface ChangesetConfig {
  fixed?: string[][];
  linked?: string[][];
  changelog?: [string, Record<string, unknown>];
  access?: string;
  baseBranch?: string;
}
