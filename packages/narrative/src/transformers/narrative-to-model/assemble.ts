import type { Message, Model, Narrative } from '../../index';
import { deriveModules } from './derive-modules';

export function assembleSpecs(narratives: Narrative[], messages: unknown[], integrations: unknown[]): Model {
  const typedMessages = messages as Message[];
  const modules = deriveModules(narratives, typedMessages);

  return {
    variant: 'specs' as const,
    narratives,
    messages: typedMessages,
    integrations: integrations as Model['integrations'],
    modules,
  };
}
