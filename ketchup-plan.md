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

### Bottle: model-factory (auto-engineer-1)

- [ ] Burst 1: Scaffold model-factory package infra [depends: none]
  - Create `packages/model-factory/package.json` (name: `@auto-engineer/model-factory`, deps: `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/openai-compatible`, `@ai-sdk/xai`, peer: `ai@>=5.0.0`)
  - Create `packages/model-factory/tsconfig.json` (extends `../../tsconfig.base.json`, composite: true)
  - Add to root `tsconfig.json` references
  - `pnpm install`
  - Infra commit, no test needed

- [ ] Burst 2: createModelFromEnv creates custom provider model from env [depends: 1]
  - `packages/model-factory/src/index.ts`: export `createModelFromEnv(options?)` -- custom provider path using `createOpenAICompatible({ name, baseURL, apiKey })`, reads `CUSTOM_PROVIDER_*` env vars, throws on missing config
  - `packages/model-factory/src/index.specs.ts`: test custom provider creation with env vars set, test throws when env vars missing
  - Export `Provider` type, `DEFAULT_MODELS` constant

- [ ] Burst 3: createModelFromEnv supports direct providers and option overrides [depends: 2]
  - Add openai/anthropic/google/xai branches (delegate to `createOpenAI()`, `createAnthropic()`, `createGoogleGenerativeAI()`, `createXai()`)
  - Default `DEFAULT_AI_PROVIDER` to `custom` when unset
  - Support `options.model` and `options.provider` overrides
  - Use `DEFAULT_AI_MODEL` env var when `options.model` unset
  - Tests: each provider returns model, defaults to custom, option overrides work

### Bottle: Migrate auto-engineer-1 consumers

- [ ] Burst 4: Migrate information-architect to model-factory + ai [depends: 3]
  - `packages/information-architect/src/ia-agent.ts`:
    - Replace `import { type AIProvider, generateTextWithAI } from '@auto-engineer/ai-gateway'`
    - With `import { createModelFromEnv } from '@auto-engineer/model-factory'` + `import { generateText, type LanguageModel } from 'ai'`
    - Constructor takes `LanguageModel` param (default `createModelFromEnv()`)
    - Replace `generateTextWithAI(prompt, { provider, temperature, maxTokens })` -> `generateText({ model: this.model, prompt, temperature, maxTokens }).then(r => r.text)`
    - Drop `AIProvider` type usage entirely
  - `packages/information-architect/package.json`: swap `@auto-engineer/ai-gateway` -> `@auto-engineer/model-factory` + `ai`
  - `packages/information-architect/tsconfig.json`: update reference from ai-gateway -> model-factory
  - No existing test files for ia-agent.ts

- [ ] Burst 5: Migrate server-implementer to model-factory + ai [depends: 3]
  - `packages/server-implementer/src/agent/runSlice.ts`:
    - Replace `import { generateTextWithAI } from '@auto-engineer/ai-gateway'`
    - With `import { createModelFromEnv } from '@auto-engineer/model-factory'` + `import { generateText } from 'ai'`
    - Replace 3x `generateTextWithAI(prompt)` -> `generateText({ model: createModelFromEnv(), prompt }).then(r => r.text)`
  - `packages/server-implementer/src/commands/implement-slice.ts`:
    - Same import swap
    - Replace `generateTextWithAI(prompt, { maxTokens })` -> `generateText({ model: createModelFromEnv(), prompt, maxTokens }).then(r => r.text)`
  - `packages/server-implementer/package.json`: swap `@auto-engineer/ai-gateway` -> `@auto-engineer/model-factory` + `ai`
  - `packages/server-implementer/tsconfig.json`: update reference from ai-gateway -> model-factory

- [ ] Burst 6: Migrate react-component-implementer to model-factory [depends: 3]
  - `packages/react-component-implementer/src/commands/implement-react-component.ts`:
    - Replace inline `createOpenAICompatible()` + env var reading with `createModelFromEnv()`
    - Remove `@ai-sdk/openai-compatible` import
  - `packages/react-component-implementer/package.json`: swap `@ai-sdk/openai-compatible` -> `@auto-engineer/model-factory`

- [ ] Burst 7: Migrate app-implementer (auto-engineer) to model-factory [depends: 3]
  - `packages/app-implementer/src/commands/implement-react-app.ts`: same pattern as Burst 6
  - `packages/app-implementer/package.json`: swap `@ai-sdk/openai-compatible` -> `@auto-engineer/model-factory`

### Bottle: Delete ai-gateway (auto-engineer-1)

- [ ] Burst 8: Delete packages/ai-gateway and clean all references [depends: 4, 5]
  - Delete `packages/ai-gateway/` directory entirely
  - Remove from root `tsconfig.json` references
  - Verify no remaining imports: `grep -r "ai-gateway" --include="*.ts" packages/`
  - Run `pnpm install` to clean lockfile

### Bottle: Delete ai-client (on.auto-1)

- [ ] Burst 9: Delete packages/ai-client and clean worker-runtime [depends: none]
  - Delete `on.auto-1/packages/ai-client/` entirely
  - `on.auto-1/packages/worker-runtime/src/index.ts`: remove re-exports (`createAIClient`, `createAIClientFromEnv`, `BudgetExceededError`, `ModelNotAllowedError`, `RateLimitError`, `GatewayError`)
  - `on.auto-1/packages/worker-runtime/package.json`: remove `@on.auto/ai-client` dependency
  - Verify no remaining imports of `@on.auto/ai-client` anywhere
  - Run `pnpm test` in on.auto-1

### Bottle: Strip litellm-client (on.auto-1)

- [ ] Burst 10: Remove gateway-model from litellm-client, keep admin API [depends: none]
  - Delete `on.auto-1/packages/litellm-client/src/gateway-model.ts`
  - Delete `on.auto-1/packages/litellm-client/src/gateway-model.test.ts`
  - `on.auto-1/packages/litellm-client/src/index.ts`: remove line `export { createGatewayModel, createGatewayModelFromEnv, DEFAULT_GATEWAY_MODEL } from './gateway-model.js'`
  - `on.auto-1/packages/litellm-client/package.json`: remove `@ai-sdk/openai` dep, remove `ai` peer dep
  - Keep `src/client.ts` (admin API) and `src/client.test.ts` untouched
  - **Cannot run full test suite yet** -- consumers still import removed exports. This burst strips the source only.

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
