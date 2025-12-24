import path from 'node:path';
import type { CommandProcessor, EventStore } from '@event-driven-io/emmett';
import fg from 'fast-glob';

export interface SliceRegistration {
  register: (messageBus: CommandProcessor, eventStore: EventStore) => Promise<unknown> | undefined;
}

export async function loadRegisterFiles(source: string): Promise<SliceRegistration[]> {
  const files = await fg(source, { absolute: true });

  const modules = await Promise.all(
    files.map(async (file) => {
      try {
        const mod: unknown = await import(pathToFileUrl(file).href);

        if (
          typeof mod === 'object' &&
          mod !== null &&
          'register' in mod &&
          typeof (mod as SliceRegistration).register === 'function'
        ) {
          return mod as SliceRegistration;
        }

        console.warn('⚠️ Skipping invalid register.ts at', file);
        return null;
      } catch (error) {
        console.error('❌ Failed to import', file, ':', error);
        return null;
      }
    }),
  );

  return modules.filter((m): m is SliceRegistration => m !== null);
}

function pathToFileUrl(filePath: string): URL {
  const resolved = path.resolve(filePath);
  return new URL(`file://${resolved}`);
}
