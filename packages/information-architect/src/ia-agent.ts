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

interface TemplateDefinition {
  layout?: {
    organisms?: string[];
  };
}

interface TemplatesContainer {
  items?: Record<string, TemplateDefinition>;
}

interface PageDefinition {
  template?: string;
}

interface IASchema {
  atoms?: ItemsContainer;
  molecules?: ItemsContainer;
  organisms?: ItemsContainer;
  templates?: TemplatesContainer;
  pages?: {
    items?: Record<string, PageDefinition>;
  };
}

export interface ValidationError {
  component: string;
  type: 'molecule' | 'organism' | 'template' | 'page';
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
  const templateNames = new Set(Object.keys(s.templates?.items ?? {}));

  // Validate molecules reference only atoms
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

  // Validate organisms reference only molecules
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

  // Validate templates reference only organisms
  for (const [name, def] of Object.entries(s.templates?.items ?? {})) {
    const referencedOrganisms = def.layout?.organisms ?? [];
    const invalidOrganisms = referencedOrganisms.filter((org: string) => !organismNames.has(org));
    if (invalidOrganisms.length > 0) {
      errors.push({
        component: name,
        type: 'template',
        field: 'layout.organisms',
        invalidReferences: invalidOrganisms,
        message: `Template "${name}" references non-existent organisms: ${invalidOrganisms.join(', ')}`,
      });
    }
  }

  // Validate pages reference only templates
  for (const [name, def] of Object.entries(s.pages?.items ?? {})) {
    const referencedTemplate = def.template;
    if (referencedTemplate && !templateNames.has(referencedTemplate)) {
      errors.push({
        component: name,
        type: 'page',
        field: 'template',
        invalidReferences: [referencedTemplate],
        message: `Page "${name}" references non-existent template: ${referencedTemplate}`,
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

CRITICAL COMPOSITION RULES - THESE ARE STRICT AND MUST BE FOLLOWED (Atomic Design Methodology):
1. Atoms: Basic UI primitives (Button, Text, Input, Icon, etc.). Atoms do NOT compose other atoms.
2. Molecules: Composed ONLY of atoms. A molecule's "composition.atoms" array must ONLY reference items that exist in "atoms.items".
3. Organisms: Composed of atoms AND molecules. An organism's "composition.molecules" array must ONLY reference items that exist in "molecules.items". An organism MUST NOT reference other organisms.
4. Templates: Page-level layout structures that place organisms into a layout. A template's "layout.organisms" array must ONLY reference items that exist in "organisms.items". Templates define the skeletal framework without real content.
5. Pages: Specific instances of templates with real representative content. A page's "template" field must reference a template that exists in "templates.items". Pages are tied to routes and populated with actual data.

VISUAL DESIGN PRINCIPLES - Apply these to create beautiful, professional UIs:

1. TYPOGRAPHY HIERARCHY (every component should consider text sizing):
   - Headlines/Titles: Large size, bold weight, commanding presence
   - Subheadings: Medium-large size, semi-bold weight, clear section breaks
   - Body text: Comfortable reading size with good line height
   - Labels/Captions: Small size, subtle color, supporting information

2. COMPONENT PURPOSE & VISUAL ROLE:
   - Molecules should be self-contained, visually complete units (cards, forms, list items)
   - Organisms should compose molecules into meaningful sections (hero sections, feature grids, data tables)
   - Templates define visual rhythm and spacing structure

3. INTERACTIVE ELEMENTS:
   - Every interactive molecule/organism should specify hover, focus, and active states in specs
   - Forms need clear validation states (success, error, loading)
   - Lists need empty states and loading states

4. SEMANTIC NAMING FOR VISUAL CLARITY:
   - Use descriptive names that hint at visual purpose: "HeroSection", "FeatureCard", "StatsGrid", "NavigationSidebar"
   - Avoid generic names like "Section1" or "Component"

5. LAYOUT CONSIDERATIONS IN TEMPLATES:
   - Define clear visual regions: header, sidebar, main content, footer
   - Consider responsive behavior in template specs
   - Use common patterns: dashboard layout, marketing layout, form-centric layout

6. TEMPLATE NAMING AND PURPOSE:
   - Name templates based on their layout structure (e.g., SidebarLayout, CenteredLayout, FullWidthLayout)
   - Templates should be reusable across different pages
   - Include layout-related specs like "responsive sidebar" or "sticky header"

7. ORGANISM DESCRIPTIONS SHOULD SPECIFY VISUAL ROLE:
   Good: "Card grid displaying items with image, title, and action buttons"
   Good: "Navigation bar with logo, menu items, and user actions"
   Bad: "Shows items" (too vague)
   Bad: "Navigation" (no visual details)

8. SPECS SHOULD INCLUDE VISUAL BEHAVIORS:
   Good specs:
   - "displays loading skeleton while fetching data"
   - "shows empty state with icon and action button when no items"
   - "items have hover effect with shadow elevation"
   - "responsive grid: 1 column mobile, 2 tablet, 3 desktop"
   Bad specs (too vague):
   - "shows data"
   - "handles loading"
   - "is responsive"

VALIDATION CHECKLIST (the schema will be rejected if these rules are violated):
- Every item in a molecule's "composition.atoms" MUST exist in "atoms.items"
- Every item in an organism's "composition.molecules" MUST exist in "molecules.items"
- An organism's "composition.molecules" MUST NOT contain names that only exist in "organisms.items"
- Every item in a template's "layout.organisms" MUST exist in "organisms.items"
- Every page's "template" MUST reference a template that exists in "templates.items"
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
- The JSON should have sections for: "atoms", "molecules", "organisms", "templates", and "pages".
- In "atoms", "molecules", and "organisms", define composite UI elements with:
    - A description
    - A "composition" field listing the building blocks used:
        - For molecules: "atoms" array referencing atomic UI primitives
        - For organisms: "molecules" array referencing molecule components
    - Example for molecule:
      "composition": {
        "atoms": ["Button", "Text"]
      }
    - Example for organism:
      "composition": {
        "molecules": ["SearchBar", "FilterPanel"]
      }
- In "templates", define page-level layout structures with:
    - description (what this layout structure provides - be specific about visual arrangement)
    - layout.organisms (array of organisms that make up the template's skeleton)
    - specs (optional array describing layout requirements like "responsive sidebar", "sticky header", "scrollable content area")
    - Templates define the structural framework WITHOUT real content
    - Common template patterns: DashboardTemplate (sidebar + main), MarketingTemplate (full-width sections), FormTemplate (centered narrow container)
- In "pages", define each page as a specific instance of a template, with:
    - route (URL path)
    - description
    - template (reference to a template in "templates.items" that defines the page's layout)
    - navigation (array of navigation actions, e.g., { "on": "Click Listing Card", "to": "ListingDetailPage" })
    - data_requirements (array for page-level data fetching - this is the "real content" that populates the template)
- For each component or page, if there are any specs defined in the model's flow slices, look at slice.client.specs which is an array of strings.
- These specs describe behavioral requirements with nested context preserved using ' → ' separator (e.g., "Form → Validation → shows error").
- Assign these specs directly to the 'specs' field for the corresponding component/page.
- If no client.specs exist for a slice, omit the 'specs' field.

Use the following structure as a template for your response:
----
{
  "atoms": {
    "description": "Basic UI primitives",
    "items": {
       "AtomName": {
          "description": "What this atom does."
       }
     }
  },
  "molecules": {
    "description": "Components composed from atoms - these are reusable visual units",
    "items": {
      "MoleculeName": {
        "description": "What this molecule does and its visual appearance (e.g., 'Card displaying user info with avatar, name, and action button').",
        "composition": { "atoms": ["Atom1", "Atom2"] },
        "specs": [
          "hover state shows shadow elevation",
          "click navigates to detail view"
        ]
      }
    }
  },
  "organisms": {
    "description": "Smart UI components composed of molecules - these are visually complete sections",
    "items": {
      "OrganismName": {
        "description": "What this organism does and its visual role (e.g., 'Hero section with headline, subtext, and CTA buttons').",
        "composition": { "molecules": ["Molecule1", "Molecule2"] },
        "specs": [
          "displays loading skeleton while fetching",
          "shows empty state when no data",
          "hover effect on interactive cards"
        ],
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
  },
  "templates": {
    "description": "Page-level layout structures that define visual rhythm and regions",
    "items": {
      "TemplateName": {
        "description": "What layout structure this template provides (e.g., 'Dashboard layout with collapsible sidebar and main content area').",
        "layout": { "organisms": ["Organism1", "Organism2"] },
        "specs": ["responsive sidebar collapses on mobile", "sticky header", "scrollable main content"]
      }
    }
  },
  "pages": {
    "description": "Specific instances of templates with real content",
    "items": {
      "PageName": {
        "route": "/route",
        "description": "What this page does.",
        "template": "TemplateName",
        "navigation": [{ "on": "Event", "to": "TargetPage" }],
        "data_requirements": [
          // ... as above
        ]
      }
    }
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
