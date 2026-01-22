import type { MessageRef } from '../../index';
import type { CrossModuleImport, GeneratedFile } from './types';

type MessageKind = MessageRef['kind'];

export function toMessageKey(kind: MessageKind, name: string): string {
  return `${kind}:${name}`;
}

function isMessageKind(value: string): value is MessageKind {
  return value === 'command' || value === 'event' || value === 'state' || value === 'query';
}

export function parseMessageKey(key: string): MessageRef {
  const colonIndex = key.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid message key format: ${key}`);
  }
  const kindStr = key.slice(0, colonIndex);
  if (!isMessageKind(kindStr)) {
    throw new Error(`Invalid message kind: ${kindStr}`);
  }
  const name = key.slice(colonIndex + 1);
  return { kind: kindStr, name };
}

export function sortMessagesByKey<T extends MessageRef>(messages: T[]): T[] {
  return [...messages].sort((a, b) => {
    const keyA = toMessageKey(a.kind, a.name);
    const keyB = toMessageKey(b.kind, b.name);
    return keyA.localeCompare(keyB);
  });
}

export function sortFilesByPath<T extends GeneratedFile>(files: T[]): T[] {
  return [...files].sort((a, b) => a.path.localeCompare(b.path));
}

export function sortImportsBySource(imports: CrossModuleImport[]): CrossModuleImport[] {
  return [...imports]
    .map((imp) => ({
      ...imp,
      typeNames: [...imp.typeNames].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.fromPath.localeCompare(b.fromPath));
}
