export type FileEvent = 'add' | 'change' | 'delete';

export type WireChange = {
  event: FileEvent;
  path: string;
  content?: string;
};

export type WireInitial = {
  files: Array<{ path: string; content: string }>;
  directory: string;
};
