import { type AIProvider, generateTextWithAI } from '@auto-engineer/ai-gateway';
import type { Model } from '@auto-engineer/narrative';
import type { AIAgentOutput, UXSchema } from './types.js';

function extractJsonFromMarkdown(text: string): string {
  return text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, '$1').trim();
}

function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

interface CompositionSection {
  atoms?: string[];
  molecules?: string[];
  organisms?: string[];
}

interface ComponentDefinition {
  composition?: CompositionSection;
}

interface ItemsContainer {
  items?: Record<string, ComponentDefinition>;
}

interface IASchema {
  atoms?: ItemsContainer;
  molecules?: ItemsContainer;
  organisms?: ItemsContainer;
  pages?: Record<string, unknown>;
}

export interface ValidationError {
  component: string;
  type: 'molecule' | 'organism';
  field: string;
  invalidReferences: string[];
  message: string;
}

export function validateCompositionReferences(schema: unknown, designSystemAtoms: string[] = []): ValidationError[] {
  const s = schema as IASchema;
  const errors: ValidationError[] = [];

  const schemaAtoms = Object.keys(s.atoms?.items ?? {});
  const atomNames = new Set([...schemaAtoms, ...designSystemAtoms]);
  const moleculeNames = new Set(Object.keys(s.molecules?.items ?? {}));
  const organismNames = new Set(Object.keys(s.organisms?.items ?? {}));

  for (const [name, def] of Object.entries(s.molecules?.items ?? {})) {
    const referencedAtoms = def.composition?.atoms ?? [];
    const invalidAtoms = referencedAtoms.filter((atom: string) => !atomNames.has(atom));
    if (invalidAtoms.length > 0) {
      errors.push({
        component: name,
        type: 'molecule',
        field: 'composition.atoms',
        invalidReferences: invalidAtoms,
        message: `Molecule "${name}" references non-existent atoms: ${invalidAtoms.join(', ')}`,
      });
    }
  }

  for (const [name, def] of Object.entries(s.organisms?.items ?? {})) {
    const referencedMolecules = def.composition?.molecules ?? [];

    const nonExistentMolecules = referencedMolecules.filter(
      (mol: string) => !moleculeNames.has(mol) && !organismNames.has(mol),
    );
    if (nonExistentMolecules.length > 0) {
      errors.push({
        component: name,
        type: 'organism',
        field: 'composition.molecules',
        invalidReferences: nonExistentMolecules,
        message: `Organism "${name}" references non-existent molecules: ${nonExistentMolecules.join(', ')}`,
      });
    }

    const organismsAsMolecules = referencedMolecules.filter(
      (mol: string) => organismNames.has(mol) && !moleculeNames.has(mol),
    );
    if (organismsAsMolecules.length > 0) {
      errors.push({
        component: name,
        type: 'organism',
        field: 'composition.molecules',
        invalidReferences: organismsAsMolecules,
        message: `Organism "${name}" incorrectly references organisms as molecules: ${organismsAsMolecules.join(', ')}. These should be in molecules.items, not organisms.items.`,
      });
    }
  }

  return errors;
}

export class InformationArchitectAgent {
  private provider?: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider;
  }

  async generateUXComponents(
    model: Model,
    uxSchema: UXSchema,
    existingSchema?: object,
    atoms?: { name: string; props: { name: string; type: string }[] }[],
    previousErrors?: string,
  ): Promise<AIAgentOutput> {
    const prompt = this.constructPrompt(model, uxSchema, existingSchema, atoms, previousErrors);
    try {
      const response = await generateTextWithAI(prompt, {
        provider: this.provider,
        temperature: 0.7,
        maxTokens: 4096 * 2,
      });
      if (!response) {
        throw new Error('No response from AI agent');
      }
      const clean = extractJsonFromMarkdown(response);
      if (!isJsonString(clean)) {
        throw new Error(`AI did not return valid JSON. Got: ${clean.slice(0, 100)}`);
      }
      return JSON.parse(clean) as AIAgentOutput;
    } catch (error) {
      console.error('Error calling AI integration:', error);
      throw error;
    }
  }

  private constructPrompt(
    model: Model,
    uxSchema: UXSchema,
    existingSchema?: object,
    atoms?: { name: string; props: { name: string; type: string }[] }[],
    previousErrors?: string,
  ): string {
    const errorContext = previousErrors
      ? `
PREVIOUS ATTEMPT FAILED VALIDATION. You MUST fix these errors:
${previousErrors}

The schema was rejected because of the composition errors above. Please regenerate the schema with these issues corrected.
`
      : '';

    return `
You are an expert UI architect and product designer. Given the following model (containing flows, messages, and integrations) and UX schema, generate a detailed JSON specification for the application's UI components and pages.
${errorContext}
IMPORTANT: Only generate pages and components that are directly referenced in the provided model's flows. Do NOT add any extra pages or components, and do NOT make assumptions outside the flows. If something is not mentioned in the flows, it should NOT appear in the output.
IMPORTANT: try your best to reuse the existing atoms, and try not to generate atoms with context: like Submit Button, because the submit part is mainly irrelevant, instead just use the Button atom if provided.

CRITICAL COMPOSITION RULES - THESE ARE STRICT AND MUST BE FOLLOWED:
1. Atoms: Basic UI primitives (Button, Text, Input, Icon, etc.). Atoms do NOT compose other atoms.
2. Molecules: Composed ONLY of atoms. A molecule's "composition.atoms" array must ONLY reference items that exist in "atoms.items".
3. Organisms: Composed of atoms AND molecules. An organism's "composition.molecules" array must ONLY reference items that exist in "molecules.items". An organism MUST NOT reference other organisms.
4. Pages: Can reference organisms, molecules, and atoms.

VALIDATION CHECKLIST (the schema will be rejected if these rules are violated):
- Every item in a molecule's "composition.atoms" MUST exist in "atoms.items"
- Every item in an organism's "composition.molecules" MUST exist in "molecules.items"
- An organism's "composition.molecules" MUST NOT contain names that only exist in "organisms.items"
- Cross-check all composition references before finalizing the output

$${atoms ? `Here is a list of available atomic components (atoms) from the design system. Use these atoms and their props as much as possible. Only create new atoms if absolutely necessary. And only put the new atoms created into the schema. \n\nAtoms:\n${JSON.stringify(atoms, null, 2)}\n` : ''}
System Model (flows, messages, integrations):
${JSON.stringify(model, null, 2)}

UX Schema:
${JSON.stringify(uxSchema, null, 2)}

${existingSchema ? `Here is the current IA schema. Only add, update, or remove what is necessary based on the new flows and UX schema. Preserve what is still relevant and do not make unnecessary changes.\n\nCurrent IA Schema:\n${JSON.stringify(existingSchema, null, 2)}\n` : ''}
Instructions:

- NEVER generate any data_requirements queries or mutations if NONE were provided from the flow schema
- Respond ONLY with a JSON object, no explanation, no markdown, no text before or after.
- The JSON should have two main sections: "components" and "pages".
- In "components", define composite UI elements (atoms, molecules, organisms) with:
    - A description
    - A "composition" field listing the building blocks used, grouped by type:
        - "atoms": for atomic UI primitives (e.g., Button, Text, InputField)
        - "molecules": for reusable, mid-level components (composed of atoms)
        - "organisms": for larger, smart UI components (composed of molecules)
    - Example:
      "composition": {
        "atoms": ["Button", "Text"],
        "molecules": ["SearchBar"],
        "organisms": ["TopNavBar"]
      }
- In "pages", define each page as a key, with:
    - route (URL path)
    - description
    - template (what wrapper does the page use)
    - navigation (array of navigation actions, e.g., { "on": "Click Listing Card", "to": "ListingDetailPage" })
    - data_requirements (array, as above, for page-level data fetching)
- For each component or page, if there are any specs defined in the model's flow slices, look at slice.client.specs which is an array of strings.
- These specs describe behavioral requirements with nested context preserved using ' → ' separator (e.g., "Form → Validation → shows error").
- Assign these specs directly to the 'specs' field for the corresponding component/page.
- If no client.specs exist for a slice, omit the 'specs' field.

Use the following structure as a template for your response:
----
{
  "atoms": {
    "items": {
       "AtomName": {
          ....
       }
     }
  },
  "molecules": {
    "items": {
      "ComponentName": {
        "description": "What this component does.",
        "composition": { "primitives": ["Primitive1", "Primitive2"] },
        "data_requirements": [
          {
            "type": "query",
            "description": "What data is fetched.",
            "trigger": "When the query runs.",
            "details": {
              "source": "Where the data comes from.",
              "gql": "GraphQL query or subscription"
            }
          }
        ]
      }
    }
    // ... more components
  },
  "pages": {
    "PageName": {
      "route": "/route",
      "description": "What this page does.",
      "navigation": [{ "on": "Event", "to": "TargetPage" }],
      "data_requirements": [
        // ... as above
      ]
    }
    // ... more pages
  }
}
----

Be concise but thorough. Use the flows and UX schema to infer the necessary components, their composition, and data requirements.
Do not include any text, explanation, or markdown—only the JSON object as described.
`;
  }
}

export async function processFlowsWithAI(
  model: Model,
  uxSchema: UXSchema,
  existingSchema?: object,
  atoms?: { name: string; props: { name: string; type: string }[] }[],
  previousErrors?: string,
): Promise<AIAgentOutput> {
  const agent = new InformationArchitectAgent();
  return agent.generateUXComponents(model, uxSchema, existingSchema, atoms, previousErrors);
}
