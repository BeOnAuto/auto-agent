import type { Model } from '../../index';
import { formatWithPrettier } from './formatting/prettier';
import { generateAllModulesCode } from './generators/module-code';
import type { GeneratedNarratives } from './types';

/**
 * Converts a schema specification to TypeScript flow DSL code files.
 *
 * This function takes a complete schema specification and generates the corresponding
 * TypeScript code using the flow DSL, including imports, type definitions, builders,
 * and flow specifications. Each module in the model produces one output file.
 *
 * @param model The complete schema specification conforming to SpecsSchema
 * @returns Promise resolving to GeneratedNarratives with files array
 */
export async function modelToNarrative(model: Model): Promise<GeneratedNarratives> {
  const flowImport = '@auto-engineer/narrative';
  const integrationImport = extractIntegrationImportFromModel(model);

  const rawFiles = generateAllModulesCode(model, { flowImport, integrationImport });

  const formattedFiles = await Promise.all(
    rawFiles.map(async (file) => ({
      path: file.path,
      code: await formatWithPrettier(file.code),
    })),
  );

  return { files: formattedFiles };
}

function extractIntegrationImportFromModel(model: Model): string {
  if (model.integrations && model.integrations.length > 0) {
    return model.integrations[0].source;
  }
  return '';
}

export type { GeneratedNarratives } from './types';
