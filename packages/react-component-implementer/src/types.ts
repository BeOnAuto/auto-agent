export interface ComponentTask {
  title: string;
  description: string;
  type: string;
  componentId: string;
  implementation: string;
  acceptanceCriteria: string[];
  prompt: string;
  storybookPath: string;
  files: { create: string[]; modify: string[] };
}

export interface Job {
  id: string;
  dependsOn: string[];
  target: string;
  payload: ComponentTask;
}
