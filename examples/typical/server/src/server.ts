import 'reflect-metadata';
import { getInMemoryDatabase, getInMemoryMessageBus } from '@event-driven-io/emmett';
import { getSQLiteEventStore } from '@event-driven-io/emmett-sqlite';
import { ApolloServer } from 'apollo-server';
import { buildSchema } from 'type-graphql';
import { loadResolvers } from './utils';

async function start() {
  const messageBus = getInMemoryMessageBus();
  const database = getInMemoryDatabase();

  const eventStore = getSQLiteEventStore({
    fileName: './event-store.sqlite',
    schema: { autoMigration: 'CreateOrUpdate' },
  });

  const resolvers = await loadResolvers('src/domain/flows/**/*.resolver.{ts,js}');
  type ResolverClass = new (...args: unknown[]) => unknown;
  const schema = await buildSchema({
    resolvers: resolvers as unknown as [ResolverClass, ...ResolverClass[]],
  });
  const server = new ApolloServer({
    schema,
    context: () => ({
      eventStore,
      messageBus,
      database,
    }),
  });
  const { url } = await server.listen({ port: 4000 });
  console.log(`🚀 GraphQL server ready at ${url}`);
}

void start();
