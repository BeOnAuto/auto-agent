import 'reflect-metadata';
import type { CommandSender, EventStore, InMemoryDatabase } from '@event-driven-io/emmett';

export interface GraphQLContext {
  eventStore: EventStore;
  messageBus: CommandSender;
  database: InMemoryDatabase;
}
