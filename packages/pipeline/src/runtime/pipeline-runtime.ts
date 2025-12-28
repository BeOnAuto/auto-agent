import type { Event } from '@auto-engineer/message-bus';
import type {
  CustomHandlerDescriptor,
  EmitHandlerDescriptor,
  EventHandlerDescriptor,
  ForEachPhasedDescriptor,
  PipelineDescriptor,
  RunAwaitHandlerDescriptor,
} from '../core/descriptors';
import type { PipelineContext } from './context';

export class PipelineRuntime {
  private readonly handlerIndex: Map<string, EventHandlerDescriptor[]>;

  constructor(public readonly descriptor: PipelineDescriptor) {
    this.handlerIndex = this.buildHandlerIndex();
  }

  getHandlersForEvent(eventType: string): EventHandlerDescriptor[] {
    return this.handlerIndex.get(eventType) ?? [];
  }

  getMatchingHandlers(event: Event): EventHandlerDescriptor[] {
    const handlers = this.getHandlersForEvent(event.type);
    return handlers.filter((handler) => {
      if (!handler.predicate) return true;
      return handler.predicate(event);
    });
  }

  async handleEvent(event: Event, ctx: PipelineContext): Promise<void> {
    const handlers = this.getMatchingHandlers(event);
    for (const handler of handlers) {
      switch (handler.type) {
        case 'emit':
          await this.executeEmitHandler(handler, event, ctx);
          break;
        case 'custom':
          await this.executeCustomHandler(handler, event, ctx);
          break;
        case 'run-await':
          await this.executeRunAwaitHandler(handler, event, ctx);
          break;
        case 'foreach-phased':
          if (ctx.startPhased !== undefined) {
            ctx.startPhased(handler, event);
          } else {
            await this.executeForEachPhasedHandler(handler, event, ctx);
          }
          break;
      }
    }
  }

  private async executeEmitHandler(handler: EmitHandlerDescriptor, event: Event, ctx: PipelineContext): Promise<void> {
    await Promise.all(
      handler.commands.map(async (command) => {
        const data = typeof command.data === 'function' ? command.data(event) : command.data;
        await ctx.sendCommand(command.commandType, data);
      }),
    );
  }

  private async executeCustomHandler(
    handler: CustomHandlerDescriptor,
    event: Event,
    ctx: PipelineContext,
  ): Promise<void> {
    await handler.handler(event, ctx);
  }

  private async executeRunAwaitHandler(
    handler: RunAwaitHandlerDescriptor,
    event: Event,
    ctx: PipelineContext,
  ): Promise<void> {
    const commands = typeof handler.commands === 'function' ? handler.commands(event) : handler.commands;
    for (const command of commands) {
      const data = typeof command.data === 'function' ? command.data(event) : command.data;
      await ctx.sendCommand(command.commandType, data);
    }
  }

  private async executeForEachPhasedHandler(
    handler: ForEachPhasedDescriptor,
    event: Event,
    ctx: PipelineContext,
  ): Promise<void> {
    const items = handler.itemsSelector(event);
    const phaseGroups: Record<string, unknown[]> = {};

    for (const phase of handler.phases) {
      phaseGroups[phase] = [];
    }

    for (const item of items) {
      const phase = handler.classifier(item);
      phaseGroups[phase]?.push(item);
    }

    for (const phase of handler.phases) {
      for (const item of phaseGroups[phase]) {
        const command = handler.emitFactory(item, phase, event);
        await ctx.sendCommand(command.commandType, command.data);
      }
    }
  }

  private buildHandlerIndex(): Map<string, EventHandlerDescriptor[]> {
    const index = new Map<string, EventHandlerDescriptor[]>();
    for (const handler of this.descriptor.handlers) {
      if (handler.type === 'settled') {
        continue;
      }
      const existing = index.get(handler.eventType) ?? [];
      existing.push(handler);
      index.set(handler.eventType, existing);
    }
    return index;
  }
}
