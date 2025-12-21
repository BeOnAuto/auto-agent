import type { Event } from '@auto-engineer/message-bus';
import type {
  CustomHandlerDescriptor,
  EmitHandlerDescriptor,
  HandlerDescriptor,
  PipelineDescriptor,
} from '../core/descriptors';
import type { PipelineContext } from './context';

export class PipelineRuntime {
  private readonly handlerIndex: Map<string, HandlerDescriptor[]>;

  constructor(public readonly descriptor: PipelineDescriptor) {
    this.handlerIndex = this.buildHandlerIndex();
  }

  getHandlersForEvent(eventType: string): HandlerDescriptor[] {
    return this.handlerIndex.get(eventType) ?? [];
  }

  getMatchingHandlers(event: Event): HandlerDescriptor[] {
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
          await this.executeCustomHandler(handler, event);
          break;
      }
    }
  }

  private async executeEmitHandler(handler: EmitHandlerDescriptor, event: Event, ctx: PipelineContext): Promise<void> {
    for (const command of handler.commands) {
      const data = typeof command.data === 'function' ? command.data(event) : command.data;
      await ctx.sendCommand(command.commandType, data);
    }
  }

  private async executeCustomHandler(handler: CustomHandlerDescriptor, event: Event): Promise<void> {
    await handler.handler(event);
  }

  private buildHandlerIndex(): Map<string, HandlerDescriptor[]> {
    const index = new Map<string, HandlerDescriptor[]>();
    for (const handler of this.descriptor.handlers) {
      const existing = index.get(handler.eventType) ?? [];
      existing.push(handler);
      index.set(handler.eventType, existing);
    }
    return index;
  }
}
