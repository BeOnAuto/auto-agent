import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/sqlite';
import { join } from 'path';

export default defineConfig({
  entities: [],
  dbName: process.env.NODE_ENV === 'test' ? ':memory:' : './db.sqlite',
  debug: process.env.NODE_ENV !== 'production',
  allowGlobalContext: true,
  extensions: [Migrator],
  migrations: {
    path: join(__dirname, 'src/migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: true,
    disableForeignKeys: false,
    emit: 'ts',
  },
});
