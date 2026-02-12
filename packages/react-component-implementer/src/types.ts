export interface ComponentTask {
  name: string;
  description: string;
  level: 'atom' | 'molecule' | 'organism';
  props: Record<string, string>;
  variants?: string[];
  state?: string[];
  requests?: string[];
  prompt?: string;
}
