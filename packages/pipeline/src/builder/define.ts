import type { EventPredicate, HandlerDescriptor, KeyExtractor, PipelineDescriptor } from '../core/descriptors';

export interface Pipeline {
  descriptor: Readonly<PipelineDescriptor>;
}

export interface PipelineBuilder {
  version(v: string): PipelineBuilder;
  description(d: string): PipelineBuilder;
  key<E>(name: string, extractor: (event: E) => string): PipelineBuilder;
  on(eventType: string): TriggerBuilder;
  build(): Pipeline;
}

export interface TriggerBuilder {
  when<E>(predicate: (event: E) => boolean): TriggerBuilder;
  emit(commandType: string, data: unknown): EmitChain;
}

export interface EmitChain {
  emit(commandType: string, data: unknown): EmitChain;
  on(eventType: string): TriggerBuilder;
  build(): Pipeline;
}

class PipelineBuilderImpl implements PipelineBuilder {
  private readonly name: string;
  private versionValue?: string;
  private descriptionValue?: string;
  private readonly keys: Map<string, KeyExtractor> = new Map();
  private readonly handlers: HandlerDescriptor[] = [];

  constructor(name: string) {
    this.name = name;
  }

  version(v: string): PipelineBuilder {
    this.versionValue = v;
    return this;
  }

  description(d: string): PipelineBuilder {
    this.descriptionValue = d;
    return this;
  }

  key<E>(name: string, extractor: (event: E) => string): PipelineBuilder {
    this.keys.set(name, extractor as KeyExtractor);
    return this;
  }

  on(eventType: string): TriggerBuilder {
    return new TriggerBuilderImpl(this, eventType);
  }

  addHandler(handler: HandlerDescriptor): void {
    this.handlers.push(handler);
  }

  build(): Pipeline {
    const descriptor: PipelineDescriptor = {
      name: this.name,
      version: this.versionValue,
      description: this.descriptionValue,
      keys: this.keys,
      handlers: this.handlers,
    };
    return { descriptor: Object.freeze(descriptor) };
  }
}

class TriggerBuilderImpl implements TriggerBuilder {
  private predicate?: EventPredicate;

  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
  ) {}

  when<E>(predicate: (event: E) => boolean): TriggerBuilder {
    this.predicate = predicate as EventPredicate;
    return this;
  }

  emit(commandType: string, data: unknown): EmitChain {
    return new EmitChainImpl(this.parent, this.eventType, [{ commandType, data }], this.predicate);
  }
}

class EmitChainImpl implements EmitChain {
  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
    private readonly commands: Array<{ commandType: string; data: unknown }>,
    private readonly predicate?: EventPredicate,
  ) {}

  emit(commandType: string, data: unknown): EmitChain {
    return new EmitChainImpl(this.parent, this.eventType, [...this.commands, { commandType, data }], this.predicate);
  }

  on(eventType: string): TriggerBuilder {
    this.finalizeHandler();
    return new TriggerBuilderImpl(this.parent, eventType);
  }

  build(): Pipeline {
    this.finalizeHandler();
    return this.parent.build();
  }

  private finalizeHandler(): void {
    this.parent.addHandler({
      type: 'emit',
      eventType: this.eventType,
      predicate: this.predicate,
      commands: this.commands.map((c) => ({
        commandType: c.commandType,
        data: c.data as Record<string, unknown>,
      })),
    });
  }
}

export function define(name: string): PipelineBuilder {
  return new PipelineBuilderImpl(name);
}
