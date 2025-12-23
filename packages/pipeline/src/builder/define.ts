import type { Event } from '@auto-engineer/message-bus';
import type {
  CustomHandlerDescriptor,
  EmitHandlerDescriptor,
  EventPredicate,
  FailureContext,
  ForEachPhasedDescriptor,
  GatherEventConfig,
  HandlerDescriptor,
  KeyExtractor,
  PipelineDescriptor,
  RunAwaitHandlerDescriptor,
  SettledHandler,
  SettledHandlerDescriptor,
  SuccessContext,
} from '../core/descriptors';
import type { CommandDispatch } from '../core/types';
import type { GraphEdge, GraphIR, GraphNode } from '../graph/types';
import type { PipelineContext } from '../runtime/context';

export interface Pipeline {
  descriptor: Readonly<PipelineDescriptor>;
  toGraph(): GraphIR;
}

export interface PipelineBuilder {
  version(v: string): PipelineBuilder;
  description(d: string): PipelineBuilder;
  key<E>(name: string, extractor: (event: E) => string): PipelineBuilder;
  on(eventType: string): TriggerBuilder;
  settled(commandTypes: readonly string[]): SettledBuilder;
  build(): Pipeline;
}

export interface SettledBuilder {
  dispatch(handler: SettledHandler): SettledChain;
}

export interface SettledChain {
  on(eventType: string): TriggerBuilder;
  settled(commandTypes: readonly string[]): SettledBuilder;
  build(): Pipeline;
}

export interface HandleOptions {
  emits?: string[];
}

export interface TriggerBuilder {
  when<E>(predicate: (event: E) => boolean): TriggerBuilder;
  emit(commandType: string, data: unknown): EmitChain;
  run(commands: CommandDispatch[]): RunBuilder;
  run<E>(factory: (event: E) => CommandDispatch[]): RunBuilder;
  forEach<E, T>(itemsSelector: (event: E) => T[]): ForEachBuilder<T>;
  handle<E>(handler: (event: E, ctx: PipelineContext) => void | Promise<void>, options?: HandleOptions): HandleChain;
}

export interface ForEachBuilder<T> {
  groupInto<P extends string>(phases: readonly P[], classifier: (item: T) => P): PhasedBuilder<T>;
}

export interface PhasedBuilder<T> {
  process(commandType: string, dataFactory: (item: T) => Record<string, unknown>): PhasedChain<T>;
}

export interface CompletionConfig {
  success: string;
  failure: string;
  itemKey: (event: Event) => string;
}

export interface PhasedChain<T> {
  stopOnFailure(): PhasedChain<T>;
  onComplete(config: CompletionConfig): PhasedTerminal;
  build(): Pipeline;
}

export interface PhasedTerminal {
  on(eventType: string): TriggerBuilder;
  build(): Pipeline;
}

export interface RunBuilder {
  awaitAll<E>(keyName: string, keyExtractor: (event: E) => string, options?: { timeout?: number }): GatherBuilder;
}

export interface GatherBuilder {
  onSuccess<T = unknown>(
    eventType: string,
    dataFactory: (ctx: SuccessContext<T>) => Record<string, unknown>,
  ): GatherChain;
  onFailure<T = unknown>(
    eventType: string,
    dataFactory: (ctx: FailureContext<T>) => Record<string, unknown>,
  ): GatherChain;
  on(eventType: string): TriggerBuilder;
  build(): Pipeline;
}

export interface GatherChain {
  onSuccess<T = unknown>(
    eventType: string,
    dataFactory: (ctx: SuccessContext<T>) => Record<string, unknown>,
  ): GatherChain;
  onFailure<T = unknown>(
    eventType: string,
    dataFactory: (ctx: FailureContext<T>) => Record<string, unknown>,
  ): GatherChain;
  on(eventType: string): TriggerBuilder;
  build(): Pipeline;
}

export interface EmitChain {
  emit(commandType: string, data: unknown): EmitChain;
  on(eventType: string): TriggerBuilder;
  settled(commandTypes: readonly string[]): SettledBuilder;
  build(): Pipeline;
}

export interface HandleChain {
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

  settled(commandTypes: readonly string[]): SettledBuilder {
    return new SettledBuilderImpl(this, commandTypes);
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
    const frozenDescriptor = Object.freeze(descriptor);
    return {
      descriptor: frozenDescriptor,
      toGraph: () => extractGraph(frozenDescriptor),
    };
  }
}

type GraphBuilderContext = {
  nodeMap: Map<string, GraphNode>;
  edges: GraphEdge[];
};

function addNode(ctx: GraphBuilderContext, id: string, type: 'event' | 'command', label: string): void {
  if (!ctx.nodeMap.has(id)) {
    ctx.nodeMap.set(id, { id, type, label });
  }
}

function processEmitHandler(ctx: GraphBuilderContext, handler: EmitHandlerDescriptor): void {
  addNode(ctx, `evt:${handler.eventType}`, 'event', handler.eventType);
  for (const cmd of handler.commands) {
    addNode(ctx, `cmd:${cmd.commandType}`, 'command', cmd.commandType);
    ctx.edges.push({ from: `evt:${handler.eventType}`, to: `cmd:${cmd.commandType}` });
  }
}

function processRunAwaitHandler(ctx: GraphBuilderContext, handler: RunAwaitHandlerDescriptor): void {
  addNode(ctx, `evt:${handler.eventType}`, 'event', handler.eventType);
  const commands = Array.isArray(handler.commands) ? handler.commands : [];
  for (const cmd of commands) {
    addNode(ctx, `cmd:${cmd.commandType}`, 'command', cmd.commandType);
    ctx.edges.push({ from: `evt:${handler.eventType}`, to: `cmd:${cmd.commandType}` });
  }
  if (handler.onSuccess) {
    addNode(ctx, `evt:${handler.onSuccess.eventType}`, 'event', handler.onSuccess.eventType);
  }
  if (handler.onFailure) {
    addNode(ctx, `evt:${handler.onFailure.eventType}`, 'event', handler.onFailure.eventType);
  }
}

function processForEachPhasedHandler(ctx: GraphBuilderContext, handler: ForEachPhasedDescriptor): void {
  addNode(ctx, `evt:${handler.eventType}`, 'event', handler.eventType);
  const sampleCmd = handler.emitFactory({}, '', { type: '', data: {} });
  addNode(ctx, `cmd:${sampleCmd.commandType}`, 'command', sampleCmd.commandType);
  ctx.edges.push({ from: `evt:${handler.eventType}`, to: `cmd:${sampleCmd.commandType}` });
  addNode(ctx, `evt:${handler.completion.successEvent}`, 'event', handler.completion.successEvent);
  addNode(ctx, `evt:${handler.completion.failureEvent}`, 'event', handler.completion.failureEvent);
  ctx.edges.push({ from: `cmd:${sampleCmd.commandType}`, to: `evt:${handler.completion.successEvent}` });
  ctx.edges.push({ from: `cmd:${sampleCmd.commandType}`, to: `evt:${handler.completion.failureEvent}` });
}

function processCustomHandler(ctx: GraphBuilderContext, handler: CustomHandlerDescriptor): void {
  addNode(ctx, `evt:${handler.eventType}`, 'event', handler.eventType);
  if (handler.declaredEmits) {
    for (const emittedEvent of handler.declaredEmits) {
      addNode(ctx, `evt:${emittedEvent}`, 'event', emittedEvent);
      ctx.edges.push({ from: `evt:${handler.eventType}`, to: `evt:${emittedEvent}` });
    }
  }
}

function processSettledHandler(ctx: GraphBuilderContext, handler: SettledHandlerDescriptor): void {
  const settledNodeId = `settled:${handler.commandTypes.join(',')}`;
  addNode(ctx, settledNodeId, 'command', `settled(${handler.commandTypes.join(', ')})`);

  for (const commandType of handler.commandTypes) {
    addNode(ctx, `cmd:${commandType}`, 'command', commandType);
    ctx.edges.push({ from: `cmd:${commandType}`, to: settledNodeId });
  }

  if (handler.dispatches) {
    for (const dispatchedCommand of handler.dispatches) {
      addNode(ctx, `cmd:${dispatchedCommand}`, 'command', dispatchedCommand);
      ctx.edges.push({ from: settledNodeId, to: `cmd:${dispatchedCommand}` });
    }
  }
}

function extractGraph(descriptor: PipelineDescriptor): GraphIR {
  const ctx: GraphBuilderContext = {
    nodeMap: new Map<string, GraphNode>(),
    edges: [],
  };

  for (const handler of descriptor.handlers) {
    switch (handler.type) {
      case 'emit':
        processEmitHandler(ctx, handler);
        break;
      case 'run-await':
        processRunAwaitHandler(ctx, handler);
        break;
      case 'foreach-phased':
        processForEachPhasedHandler(ctx, handler);
        break;
      case 'custom':
        processCustomHandler(ctx, handler);
        break;
      case 'settled':
        processSettledHandler(ctx, handler);
        break;
    }
  }

  return {
    nodes: Array.from(ctx.nodeMap.values()),
    edges: ctx.edges,
  };
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

  run(commandsOrFactory: CommandDispatch[] | ((event: Event) => CommandDispatch[])): RunBuilder {
    return new RunBuilderImpl(this.parent, this.eventType, commandsOrFactory, this.predicate);
  }

  forEach<E, T>(itemsSelector: (event: E) => T[]): ForEachBuilder<T> {
    return new ForEachBuilderImpl<T>(
      this.parent,
      this.eventType,
      itemsSelector as (event: Event) => unknown[],
      this.predicate,
    );
  }

  handle<E>(handler: (event: E, ctx: PipelineContext) => void | Promise<void>, options?: HandleOptions): HandleChain {
    return new HandleChainImpl(
      this.parent,
      this.eventType,
      handler as (event: Event, ctx: PipelineContext) => void | Promise<void>,
      this.predicate,
      options?.emits,
    );
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

  settled(commandTypes: readonly string[]): SettledBuilder {
    this.finalizeHandler();
    return new SettledBuilderImpl(this.parent, commandTypes);
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

class HandleChainImpl implements HandleChain {
  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
    private readonly handler: (event: Event, ctx: PipelineContext) => void | Promise<void>,
    private readonly predicate?: EventPredicate,
    private readonly declaredEmits?: string[],
  ) {}

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
      type: 'custom',
      eventType: this.eventType,
      predicate: this.predicate,
      handler: this.handler,
      declaredEmits: this.declaredEmits,
    });
  }
}

class RunBuilderImpl implements RunBuilder {
  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
    private readonly commands: CommandDispatch[] | ((event: Event) => CommandDispatch[]),
    private readonly predicate?: EventPredicate,
  ) {}

  awaitAll<E>(keyName: string, keyExtractor: (event: E) => string, options?: { timeout?: number }): GatherBuilder {
    return new GatherBuilderImpl(
      this.parent,
      this.eventType,
      this.commands,
      this.predicate,
      keyName,
      keyExtractor as KeyExtractor,
      options?.timeout,
    );
  }
}

class GatherBuilderImpl implements GatherBuilder {
  private successConfig?: GatherEventConfig<SuccessContext>;
  private failureConfig?: GatherEventConfig<FailureContext>;

  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
    private readonly commands: CommandDispatch[] | ((event: Event) => CommandDispatch[]),
    private readonly predicate: EventPredicate | undefined,
    private readonly keyName: string,
    private readonly keyExtractor: KeyExtractor,
    private readonly timeout?: number,
  ) {}

  onSuccess<T = unknown>(
    eventType: string,
    dataFactory: (ctx: SuccessContext<T>) => Record<string, unknown>,
  ): GatherChain {
    this.successConfig = { eventType, dataFactory: dataFactory as (ctx: SuccessContext) => Record<string, unknown> };
    return new GatherChainImpl(this, this.parent);
  }

  onFailure<T = unknown>(
    eventType: string,
    dataFactory: (ctx: FailureContext<T>) => Record<string, unknown>,
  ): GatherChain {
    this.failureConfig = { eventType, dataFactory: dataFactory as (ctx: FailureContext) => Record<string, unknown> };
    return new GatherChainImpl(this, this.parent);
  }

  on(eventType: string): TriggerBuilder {
    this.finalizeHandler();
    return new TriggerBuilderImpl(this.parent, eventType);
  }

  build(): Pipeline {
    this.finalizeHandler();
    return this.parent.build();
  }

  setSuccessConfig(config: GatherEventConfig<SuccessContext>): void {
    this.successConfig = config;
  }

  setFailureConfig(config: GatherEventConfig<FailureContext>): void {
    this.failureConfig = config;
  }

  private finalizeHandler(): void {
    this.parent.addHandler({
      type: 'run-await',
      eventType: this.eventType,
      predicate: this.predicate,
      commands: this.commands,
      awaitConfig: {
        keyName: this.keyName,
        key: this.keyExtractor,
        timeout: this.timeout,
      },
      onSuccess: this.successConfig,
      onFailure: this.failureConfig,
    });
  }
}

class GatherChainImpl implements GatherChain {
  constructor(
    private readonly gatherBuilder: GatherBuilderImpl,
    private readonly parent: PipelineBuilderImpl,
  ) {}

  onSuccess<T = unknown>(
    eventType: string,
    dataFactory: (ctx: SuccessContext<T>) => Record<string, unknown>,
  ): GatherChain {
    this.gatherBuilder.setSuccessConfig({
      eventType,
      dataFactory: dataFactory as (ctx: SuccessContext) => Record<string, unknown>,
    });
    return this;
  }

  onFailure<T = unknown>(
    eventType: string,
    dataFactory: (ctx: FailureContext<T>) => Record<string, unknown>,
  ): GatherChain {
    this.gatherBuilder.setFailureConfig({
      eventType,
      dataFactory: dataFactory as (ctx: FailureContext) => Record<string, unknown>,
    });
    return this;
  }

  on(eventType: string): TriggerBuilder {
    return this.gatherBuilder.on(eventType);
  }

  build(): Pipeline {
    return this.gatherBuilder.build();
  }
}

class ForEachBuilderImpl<T> implements ForEachBuilder<T> {
  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
    private readonly itemsSelector: (event: Event) => unknown[],
    private readonly predicate?: EventPredicate,
  ) {}

  groupInto<P extends string>(phases: readonly P[], classifier: (item: T) => P): PhasedBuilder<T> {
    return new PhasedBuilderImpl<T>(
      this.parent,
      this.eventType,
      this.itemsSelector,
      this.predicate,
      phases,
      classifier as (item: unknown) => string,
    );
  }
}

class PhasedBuilderImpl<T> implements PhasedBuilder<T> {
  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
    private readonly itemsSelector: (event: Event) => unknown[],
    private readonly predicate: EventPredicate | undefined,
    private readonly phases: readonly string[],
    private readonly classifier: (item: unknown) => string,
  ) {}

  process(commandType: string, dataFactory: (item: T) => Record<string, unknown>): PhasedChain<T> {
    return new PhasedChainImpl<T>(
      this.parent,
      this.eventType,
      this.itemsSelector,
      this.predicate,
      this.phases,
      this.classifier,
      commandType,
      dataFactory as (item: unknown) => Record<string, unknown>,
    );
  }
}

class PhasedChainImpl<T> implements PhasedChain<T> {
  private stopOnFailureFlag = false;
  private completionConfig?: {
    successEvent: string;
    failureEvent: string;
    itemKey: KeyExtractor;
  };

  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly eventType: string,
    private readonly itemsSelector: (event: Event) => unknown[],
    private readonly predicate: EventPredicate | undefined,
    private readonly phases: readonly string[],
    private readonly classifier: (item: unknown) => string,
    private readonly commandType: string,
    private readonly dataFactory: (item: unknown) => Record<string, unknown>,
  ) {}

  stopOnFailure(): PhasedChain<T> {
    this.stopOnFailureFlag = true;
    return this;
  }

  onComplete(config: CompletionConfig): PhasedTerminal {
    this.completionConfig = {
      successEvent: config.success,
      failureEvent: config.failure,
      itemKey: config.itemKey as KeyExtractor,
    };
    return new PhasedTerminalImpl(this, this.parent);
  }

  build(): Pipeline {
    this.finalizeHandler();
    return this.parent.build();
  }

  finalizeHandler(): void {
    if (!this.completionConfig) {
      throw new Error('onComplete() must be called before build()');
    }
    this.parent.addHandler({
      type: 'foreach-phased',
      eventType: this.eventType,
      predicate: this.predicate,
      itemsSelector: this.itemsSelector,
      phases: this.phases,
      classifier: this.classifier,
      stopOnFailure: this.stopOnFailureFlag,
      emitFactory: (item: unknown, _phase: string, _event: Event) => ({
        commandType: this.commandType,
        data: this.dataFactory(item),
      }),
      completion: this.completionConfig,
    });
  }
}

class PhasedTerminalImpl implements PhasedTerminal {
  constructor(
    private readonly phasedChain: PhasedChainImpl<unknown>,
    private readonly parent: PipelineBuilderImpl,
  ) {}

  on(eventType: string): TriggerBuilder {
    this.phasedChain.finalizeHandler();
    return new TriggerBuilderImpl(this.parent, eventType);
  }

  build(): Pipeline {
    this.phasedChain.finalizeHandler();
    return this.parent.build();
  }
}

class SettledBuilderImpl implements SettledBuilder {
  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly commandTypes: readonly string[],
  ) {}

  dispatch(handler: SettledHandler): SettledChain {
    return new SettledChainImpl(this.parent, this.commandTypes, handler);
  }
}

class SettledChainImpl implements SettledChain {
  constructor(
    private readonly parent: PipelineBuilderImpl,
    private readonly commandTypes: readonly string[],
    private readonly handler: SettledHandler,
  ) {}

  on(eventType: string): TriggerBuilder {
    this.finalizeHandler();
    return new TriggerBuilderImpl(this.parent, eventType);
  }

  settled(commandTypes: readonly string[]): SettledBuilder {
    this.finalizeHandler();
    return new SettledBuilderImpl(this.parent, commandTypes);
  }

  build(): Pipeline {
    this.finalizeHandler();
    return this.parent.build();
  }

  private finalizeHandler(): void {
    const descriptor: SettledHandlerDescriptor = {
      type: 'settled',
      commandTypes: this.commandTypes,
      handler: this.handler,
    };
    this.parent.addHandler(descriptor);
  }
}

export function define(name: string): PipelineBuilder {
  return new PipelineBuilderImpl(name);
}
