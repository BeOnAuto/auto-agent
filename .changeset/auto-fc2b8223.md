---
"@auto-engineer/ai-gateway": minor
"@auto-engineer/cli": minor
"@auto-engineer/component-implementer": minor
"@auto-engineer/design-system-importer": minor
"@auto-engineer/dev-server": minor
"@auto-engineer/file-store": minor
"@auto-engineer/frontend-checks": minor
"@auto-engineer/frontend-generator-react-graphql": minor
"@auto-engineer/frontend-implementer": minor
"@auto-engineer/id": minor
"@auto-engineer/information-architect": minor
"@auto-engineer/message-bus": minor
"@auto-engineer/message-store": minor
"@auto-engineer/model-diff": minor
"@auto-engineer/narrative": minor
"@auto-engineer/pipeline": minor
"@auto-engineer/release-automation": minor
"@auto-engineer/server-checks": minor
"@auto-engineer/server-generator-apollo-emmett": minor
"@auto-engineer/server-generator-nestjs": minor
"@auto-engineer/server-implementer": minor
"create-auto-app": minor
---

- **packages/narrative**: add @auto-engineer/narrative/schema subpath export
- **packages/model-diff**: new package for model-level change detection (incremental generation)
- **packages/server-generator-apollo-emmett**: add incremental generation support via model-diff change sets
- **global**: version packages
- **global**: add changeset
