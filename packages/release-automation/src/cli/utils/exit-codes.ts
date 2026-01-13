export const EXIT_CODE = {
  SUCCESS: 0,
  ERROR: 1,
  NO_CHANGESETS: 10,
  NO_COMMITS: 11,
  NO_CONVENTIONAL_COMMITS: 12,
  CONFIG_ERROR: 20,
  GIT_ERROR: 30,
} as const;

export type ExitCode = (typeof EXIT_CODE)[keyof typeof EXIT_CODE];
