interface ModelScene {
  id?: string;
  name?: string;
  description?: string;
  moments?: ModelMoment[];
}

interface ModelMoment {
  id?: string;
  name?: string;
  type?: string;
  description?: string;
  initiator?: string;
  client?: Record<string, unknown>;
  server?: Record<string, unknown>;
  messages?: unknown[];
}

interface ModelNarrative {
  id?: string;
  name?: string;
  description?: string;
  outcome?: string;
  requirements?: string;
  sceneIds?: string[];
  actors?: string[];
  impact?: string;
  design?: { imageAsset?: unknown };
}

interface ModelMessage {
  id?: string;
  type?: string;
  name?: string;
  fields?: { name: string; type: string }[];
}

interface Model {
  requirements?: string;
  assumptions?: string[];
  actors?: { name: string; kind?: string; description?: string }[];
  entities?: { name: string; description?: string; attributes?: string[] }[];
  narratives?: ModelNarrative[];
  scenes?: ModelScene[];
  messages?: ModelMessage[];
  design?: Record<string, unknown>;
  modules?: unknown[];
  integrations?: unknown[];
  variant?: string;
  view?: unknown;
}

function asModel(raw: unknown): Model {
  if (raw && typeof raw === 'object') return raw as Model;
  return {};
}

export function extractOverview(raw: unknown): Record<string, unknown> {
  const model = asModel(raw);
  return {
    requirements: model.requirements ?? '',
    assumptions: model.assumptions ?? [],
    actors: model.actors ?? [],
    entities: model.entities ?? [],
    narratives: (model.narratives ?? []).map((n) => ({
      id: n.id,
      name: n.name,
      description: n.description,
      outcome: n.outcome,
      requirements: n.requirements,
      sceneIds: n.sceneIds,
      actors: n.actors,
      impact: n.impact,
    })),
    scenes: (model.scenes ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      moments: (s.moments ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        description: m.description,
        initiator: m.initiator,
      })),
    })),
    messages: (model.messages ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      name: m.name,
      fields: (m.fields ?? []).map((f) => f.name),
    })),
    design: model.design
      ? {
          brief: (model.design as Record<string, unknown>).brief,
          appShell: (model.design as Record<string, unknown>).appShell,
        }
      : undefined,
  };
}

export function extractSceneDetail(raw: unknown, sceneNameOrId: string): Record<string, unknown> | null {
  const model = asModel(raw);
  const scenes = model.scenes ?? [];
  const lower = sceneNameOrId.toLowerCase();
  const scene = scenes.find(
    (s) => s.id === sceneNameOrId || (s.name ?? '').toLowerCase() === lower,
  );
  if (!scene) return null;

  const allMessages = model.messages ?? [];
  const momentMessageIds = new Set<string>();
  for (const m of scene.moments ?? []) {
    for (const msg of (m.messages ?? []) as { messageId?: string }[]) {
      if (msg.messageId) momentMessageIds.add(msg.messageId);
    }
  }
  const relatedMessages = allMessages.filter((m) => momentMessageIds.has(m.id ?? ''));

  return {
    scene,
    relatedMessages: relatedMessages.length > 0 ? relatedMessages : undefined,
  };
}

export function extractDesign(raw: unknown): Record<string, unknown> {
  const model = asModel(raw);
  return (model.design as Record<string, unknown>) ?? {};
}
