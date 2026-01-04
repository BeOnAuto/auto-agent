import type { Model } from '../../index';
import { toMessageKey } from './ordering';

export interface ValidationError {
  type:
    | 'duplicate_id'
    | 'derived_id_mismatch'
    | 'narrative_unassigned'
    | 'narrative_multi_assigned'
    | 'message_multi_declared'
    | 'message_undeclared'
    | 'narrative_not_found';
  message: string;
}

export function validateModules(model: Model): ValidationError[] {
  const errors: ValidationError[] = [];
  const modules = model.modules ?? [];

  if (modules.length === 0) {
    return errors;
  }

  errors.push(...validateUniqueModuleIds(modules));
  errors.push(...validateDerivedModuleIds(modules));

  const authoredModules = modules.filter((m) => !m.isDerived);
  if (authoredModules.length === 0) {
    return errors;
  }

  errors.push(...validateNarrativeAssignments(authoredModules, model));
  errors.push(...validateMessageDeclarations(authoredModules, model));

  return errors;
}

function validateUniqueModuleIds(modules: Model['modules']): ValidationError[] {
  const errors: ValidationError[] = [];
  const idCounts = new Map<string, number>();

  for (const module of modules) {
    idCounts.set(module.id, (idCounts.get(module.id) ?? 0) + 1);
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      errors.push({
        type: 'duplicate_id',
        message: `Module ID '${id}' is used by ${count} modules`,
      });
    }
  }

  return errors;
}

function validateDerivedModuleIds(modules: Model['modules']): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const module of modules) {
    if (module.isDerived && module.id !== module.sourceFile) {
      errors.push({
        type: 'derived_id_mismatch',
        message: `Derived module ID '${module.id}' must equal sourceFile '${module.sourceFile}'`,
      });
    }
  }

  return errors;
}

function validateNarrativeAssignments(authoredModules: Model['modules'], model: Model): ValidationError[] {
  const errors: ValidationError[] = [];
  const narrativeAssignments = new Map<string, string[]>();

  for (const module of authoredModules) {
    for (const narrativeId of module.contains.narrativeIds) {
      if (!narrativeAssignments.has(narrativeId)) {
        narrativeAssignments.set(narrativeId, []);
      }
      narrativeAssignments.get(narrativeId)!.push(module.id);
    }
  }

  const modelNarrativeIds = new Set(model.narratives.map((n) => n.id).filter((id): id is string => id !== undefined));

  for (const [narrativeId, moduleIds] of narrativeAssignments) {
    if (!modelNarrativeIds.has(narrativeId)) {
      errors.push({
        type: 'narrative_not_found',
        message: `Narrative '${narrativeId}' referenced by module(s) [${moduleIds.join(', ')}] does not exist`,
      });
    }
    if (moduleIds.length > 1) {
      errors.push({
        type: 'narrative_multi_assigned',
        message: `Narrative '${narrativeId}' is assigned to multiple modules: [${moduleIds.join(', ')}]`,
      });
    }
  }

  const assignedNarrativeIds = new Set(narrativeAssignments.keys());
  for (const narrative of model.narratives) {
    if (narrative.id && !assignedNarrativeIds.has(narrative.id)) {
      errors.push({
        type: 'narrative_unassigned',
        message: `Narrative '${narrative.id}' (${narrative.name}) is not assigned to any module`,
      });
    }
  }

  return errors;
}

function validateMessageDeclarations(authoredModules: Model['modules'], model: Model): ValidationError[] {
  const errors: ValidationError[] = [];
  const messageDeclarations = new Map<string, string[]>();

  for (const module of authoredModules) {
    for (const msg of module.declares.messages) {
      const key = toMessageKey(msg.kind, msg.name);
      if (!messageDeclarations.has(key)) {
        messageDeclarations.set(key, []);
      }
      messageDeclarations.get(key)!.push(module.id);
    }
  }

  for (const [msgKey, moduleIds] of messageDeclarations) {
    if (moduleIds.length > 1) {
      errors.push({
        type: 'message_multi_declared',
        message: `Message '${msgKey}' is declared by multiple modules: [${moduleIds.join(', ')}]`,
      });
    }
  }

  const declaredMessages = new Set(messageDeclarations.keys());
  const modelMessageKeys = new Set(model.messages.map((m) => toMessageKey(m.type, m.name)));

  for (const msgKey of modelMessageKeys) {
    if (!declaredMessages.has(msgKey)) {
      errors.push({
        type: 'message_undeclared',
        message: `Message '${msgKey}' exists in model but is not declared by any authored module`,
      });
    }
  }

  return errors;
}

export function throwOnValidationErrors(errors: ValidationError[]): void {
  if (errors.length > 0) {
    const messages = errors.map((e) => `  - ${e.message}`).join('\n');
    throw new Error(`Module validation failed:\n${messages}`);
  }
}
