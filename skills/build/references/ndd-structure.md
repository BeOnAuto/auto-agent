# NDD Structural Reference for the Build Agent

This is the canonical structural model the build agent uses when reading and reasoning about an Auto narrative model.

## The Hierarchy

NDD organises every system into four levels:

```
Domain (business capability)
└── Narrative (goal thread)
    └── Scene (single outcome)
        └── Moment (single step toward that outcome)
```

The top-level model **is** the domain. One workspace = one domain. The model holds the capability, actors, and entities once at the domain level; everything below references them.

## Canonical Definitions

| Level | Definition |
|-------|------------|
| **Domain** | A coherent business capability area that groups related narratives sharing the same core concepts, rules, and outcomes. |
| **Narrative** | A cohesive thread of related scenes that together fulfil a broader user or business goal within the domain. |
| **Scene** | A self-contained outcome achieved through one or more moments. |
| **Moment** | A single interaction or system step that moves a scene toward its outcome. |

## How to Read the Model

When you fetch the model (or scoped extracts of it), interpret the fields against this hierarchy:

| Schema field | Hierarchy role |
|--------------|----------------|
| `capability` (top-level) | The domain's capability statement |
| `actors`, `entities` (top-level) | The domain's actors and entities — reused by everything below |
| `narratives[]` | Goal threads inside the domain |
| `narratives[].goal` | The narrative's broader goal |
| `scenes[]` | Outcome scenes; each scene's name is the outcome |
| `scenes[].outcome` | The single thing that becomes true in this scene |
| `scenes[].moments[]` | The steps that move the scene toward its outcome |
| `moments[].type` | `command`, `query`, `react`, or `experience` |

When the model uses scene IDs inside a narrative (e.g. `narrative.sceneNames` referencing scenes elsewhere in the model), resolve them to their full scene records before reasoning about outcomes.

## Outcome Scopes (don't conflate them)

| Level | Scope |
|-------|-------|
| Domain | Family of related outcomes within one business capability |
| Narrative | Broader goal achieved through multiple scene outcomes |
| Scene | A single, self-contained outcome |
| Moment | A single step toward that outcome |

Reasoning at the wrong scope is a frequent cause of miscoded vertical slices. A moment is not an outcome. A scene is not a goal. A narrative is not a capability.

## Transitions Between Scenes

A moment in one scene can lead into the start of another scene whose outcome is different. The exit point is a specific moment; the entry is always the start of the target scene (never mid-way). Targets can be in the same narrative or a different one.

When you see a transition in the model, treat the target scene as a sibling outcome (not a branch off the source scene). When implementing, this usually means the source moment's handler emits an event or calls into the target scene's first moment via the same shared event log / repository.

## Moment Types

| Type | Triggers | Specs | Implementation note |
|------|----------|-------|---------------------|
| Command | Actor changes state | Interaction + Business | GraphQL mutation; emit event |
| Query | Actor receives data | Interaction + Business | GraphQL query; project state from events |
| React | System responds to event | Business only | Subscriber to an event; emits further events or commands |
| Experience | UI-only interaction | Interaction only | Client-side only; no resolver |

## Data Completeness

Every piece of state visible in a query must trace back through events to commands. The chain:

```
Command moment → emits Event → Event feeds State → State rendered in Query moment
```

Rules the agent must enforce:
- Every field in a query's state must come from an event
- Every event must be produced by a command or react moment
- The chain can cross scene and narrative boundaries — but not the domain boundary
- If a link is missing, flag it via `auto_send_model` for correction

## Naming Conventions (so generated artefacts are stable)

- **Domain names**: concise business capability — `Concert Booking`, `Team Timesheet Management`. Maps to repo / package name.
- **Narrative names**: broader goal phrasing — `Submitter records daily team hours`. Maps to `narratives/<slug>/` directory.
- **Scene names**: single-outcome phrasing — `Tickets reserved`, `Timesheet submitted`. Maps to `scenes/<slug>/` directory.
- **Moment names**: action-step phrasing — `Submitter clicks submit`. Maps to `moments/<slug>/` vertical slice directory.

Slugify by lowercasing and dashifying: `"Place Order"` → `place-order`, `"Tickets reserved"` → `tickets-reserved`.

## Anti-Patterns to Reject

When generating or correcting the model:

- **Mistaking a screen for a scene** — "Checkout page" is a screen; "Order placed" is a scene.
- **Mistaking a workflow for a scene** — "Customer onboarding" is usually a narrative or a domain.
- **Multiple outcomes in one scene** — split "Entry submitted and validated" into two scenes.
- **Microscopic UI events as moments** — "Mouse enters field" is too small; "User enters hours" is right.
- **Validation rules as scenes** — keep them as additional Given/When/Then examples in the moment's business specs.
- **Missing alternative outcomes** — if the actor's journey can end in a meaningfully different state, model it as its own scene.
- **Data appearing from nowhere** — every query state needs a traceable source.
- **Entering a scene mid-way** — scenes are always entered from the beginning.

## Generation Procedure (when the agent extends or corrects the model)

Reason **top-down**. Don't start from small actions and group them upward.

1. **Identify the domain** — the workspace = the domain. Reuse its capability/actors/entities.
2. **Identify the narrative** — which broader goal does this work fall under? Add a new narrative only if no existing one fits.
3. **Identify the scene** — what single outcome becomes true? Name it as the outcome.
4. **Identify the moments** — list the steps that fulfil the outcome. Pick the right type for each.
5. **Identify transitions** — does any moment lead into the start of another scene? Capture the exit point.
6. **Check data completeness** — trace every query's state back through events to commands.
7. **Push edge cases into business specs** — validation rules, retries, and other incidental detail stay inside the moment, not as new scenes.

## When to Defer to the Site

For the externally canonical text — the same definitions Auto users see — fetch:
- `https://www.narrativedriven.org/llms.txt` — index of canonical pages
- `https://www.narrativedriven.org/llms-full.txt` — full structural reference
- `https://www.narrativedriven.org/ndd-skill.md` — the drop-in skill

This document is the agent-internal version. It mirrors those sources but is scoped to what the build agent specifically needs while generating code from the model.
