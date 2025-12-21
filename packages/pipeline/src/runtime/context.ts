export interface PipelineContext {
  emit: (type: string, data: unknown) => Promise<void>;
  sendCommand: (type: string, data: unknown) => Promise<void>;
  correlationId: string;
}
