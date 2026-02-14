# Ketchup Plan: Kill AI Gateway — Model Factory Migration

## Context

Both repos have 3+ AI client patterns: `@auto-engineer/ai-gateway` (2000-line abstraction), `@on.auto/ai-client` (dead code), `@on.auto/litellm-client` (gateway model + admin API), and direct Vercel AI SDK usage. Kill all abstractions, create tiny `@auto-engineer/model-factory` (~50 lines), standardize on Vercel AI SDK directly.

## Env Var Convention

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `XAI_API_KEY` | Direct providers (Vercel SDK auto-reads) |
| `CUSTOM_PROVIDER_NAME`, `CUSTOM_PROVIDER_BASE_URL`, `CUSTOM_PROVIDER_API_KEY`, `CUSTOM_PROVIDER_DEFAULT_MODEL` | Custom gateway |
| `DEFAULT_AI_PROVIDER` (openai\|anthropic\|google\|xai\|custom) | Provider selection |
| `DEFAULT_AI_MODEL` | Model override |

**Migration**: `LITELLM_GATEWAY_URL` -> `CUSTOM_PROVIDER_BASE_URL` (must include `/v1` suffix!), `LITELLM_API_KEY` -> `CUSTOM_PROVIDER_API_KEY`

---

## TODO

### -- publish model-factory to npm --

### Bottle: Migrate on.auto-1 consumers

- [ ] Burst 11: Migrate narrative-agent models.ts [depends: 3 published, 10]
  - `on.auto-1/packages/narrative-agent/src/models.ts`:
    - Replace `import { createGatewayModelFromEnv, DEFAULT_GATEWAY_MODEL } from '@on.auto/litellm-client'`
    - With `import { createModelFromEnv } from '@auto-engineer/model-factory'`
    - Add local constant: `const DEFAULT_GATEWAY_MODEL = 'xai/grok-4-1-fast-non-reasoning'`
    - Change `getModelInstance` default: `createGatewayModelFromEnv` -> `(m: string) => createModelFromEnv({ model: m })`
  - `on.auto-1/packages/narrative-agent/src/models.test.ts`: no changes needed (tests use stub factory)
  - `on.auto-1/packages/narrative-agent/package.json`: add `@auto-engineer/model-factory`, can remove `@on.auto/litellm-client` if no other usage

- [ ] Burst 12: Migrate model-to-ux-model provider.ts [depends: 3 published, 10]
  - `on.auto-1/packages/model-to-ux-model/src/provider.ts`:
    - Replace `import { createGatewayModelFromEnv, DEFAULT_GATEWAY_MODEL } from '@on.auto/litellm-client'`
    - With `import { createModelFromEnv } from '@auto-engineer/model-factory'`
    - `const DEFAULT_MODEL = 'xai/grok-4-1-fast-non-reasoning'`
    - Default factory: `createGatewayModelFromEnv` -> `(m: string) => createModelFromEnv({ model: m })`
  - `on.auto-1/packages/model-to-ux-model/src/provider.test.ts`:
    - Replace `import { DEFAULT_GATEWAY_MODEL } from '@on.auto/litellm-client'` with local constant
  - `on.auto-1/packages/model-to-ux-model/package.json`: swap deps

- [ ] Burst 13: Migrate app-implementer + ui-runner CLIs (on.auto) [depends: 3 published, 10]
  - `on.auto-1/packages/app-implementer/src/cli.ts`:
    - Replace `import { createGatewayModelFromEnv, DEFAULT_GATEWAY_MODEL } from '@on.auto/litellm-client'`
    - With `import { createModelFromEnv } from '@auto-engineer/model-factory'`
    - `const DEFAULT_GATEWAY_MODEL = 'xai/grok-4-1-fast-non-reasoning'`
    - Replace `createGatewayModelFromEnv(config.model)` -> `createModelFromEnv({ model: config.model })`
  - `on.auto-1/packages/app-implementer/src/cli.test.ts`:
    - Replace `import { DEFAULT_GATEWAY_MODEL } from '@on.auto/litellm-client'` with local constant
  - `on.auto-1/packages/ui-runner/src/cli.ts`: same pattern as app-implementer
  - `on.auto-1/packages/ui-runner/src/cli.test.ts`: same test fix
  - Both `package.json` files: swap deps
  - E2E exception: combining 2 tightly-coupled CLI migrations

- [ ] Burst 14: Inline DEFAULT_GATEWAY_MODEL in collaboration-server [depends: 10]
  - `on.auto-1/applications/collaboration-server/src/worker/ai/litellm-model.ts`:
    - Replace `import { DEFAULT_GATEWAY_MODEL } from '@on.auto/litellm-client'`
    - With local constant `const DEFAULT_MODEL = 'xai/grok-4-1-fast-non-reasoning'`
    - Keep `createOpenAI` from `@ai-sdk/openai` (correct for explicit config in CF Worker)
  - `on.auto-1/applications/collaboration-server/src/worker/ai/litellm-model.test.ts`:
    - Replace `import { DEFAULT_GATEWAY_MODEL } from '@on.auto/litellm-client'` with local constant
  - Remove `@on.auto/litellm-client` from collaboration-server deps if no other usage

### Bottle: Update .env files (on.auto-1)

- [ ] Burst 15: Update .env.example files across on.auto-1 [depends: 11, 12, 13]
  - Replace `LITELLM_GATEWAY_URL` -> `CUSTOM_PROVIDER_BASE_URL`
  - Replace `LITELLM_API_KEY` -> `CUSTOM_PROVIDER_API_KEY`
  - Add `CUSTOM_PROVIDER_NAME=litellm`, `DEFAULT_AI_PROVIDER=custom`
  - Files:
    - `on.auto-1/packages/narrative-agent/.env.example`
    - `on.auto-1/packages/model-to-ux-model/.env.example`
    - `on.auto-1/packages/app-implementer/.env.example`
    - `on.auto-1/packages/ui-runner/.env.example`
  - Infra commit, no test needed

---

## DONE

### Bottle: model-factory (auto-engineer-1)

- [x] Burst 1: Scaffold model-factory package infra (9c61c88d)
- [x] Burst 2: createModelFromEnv custom provider path (1febc560)
- [x] Burst 3: Add direct providers + overrides (9d8dd337)
- [x] Refactor: Return LanguageModel from ai SDK (d87a560f)

### Bottle: Migrate auto-engineer-1 consumers

- [x] Burst 4: Migrate information-architect (ed427ed6)
- [x] Burst 5: Migrate server-implementer (40206ec9)
- [x] Burst 6: Migrate react-component-implementer (099c11a8)
- [x] Burst 7: Migrate app-implementer (4f9d95d0)

### Bottle: Delete ai-gateway (auto-engineer-1)

- [x] Burst 8: Delete ai-gateway package + clean references (4e1270a1)

### Bottle: Delete ai-client (on.auto-1)

- [x] Burst 9: Delete ai-client + clean worker-runtime (023ae982)

### Bottle: Strip litellm-client (on.auto-1)

- [x] Burst 10: Strip gateway-model from litellm-client (023ae982)

---

## Parallelization Map

```
Burst 1 -> 2 -> 3 --+-- 4 --+-- 8 (delete ai-gateway)
                     +-- 5 --+
                     +-- 6
                     +-- 7

Burst 9 (delete ai-client)     [parallel with all above]
Burst 10 (strip litellm)       [parallel with all above]

    [publish model-factory]

Burst 11 --+
Burst 12 --+
Burst 13 --+-- 15 (update .env)
Burst 14 --+   [14 only needs 10, not publish]
```

Bursts 4+5+6+7 can run in parallel. Bursts 9+10 can run in parallel with Bottle 1. Bursts 11+12+13+14 can run in parallel.

## Verification

After each bottle: `pnpm test` and `pnpm type-check` in the affected repo.

Final check: `grep -r "ai-gateway\|ai-client\|createGatewayModel\|LITELLM_GATEWAY_URL\|LITELLM_API_KEY" --include="*.ts" packages/ applications/` returns no hits in either repo.
