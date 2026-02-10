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
"@auto-engineer/job-graph-processor": minor
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

- Added new model-diff package for incremental code generation, detecting which slices changed between runs to avoid regenerating everything
- Added 3-mode generation support (full, no-change, incremental) to the Apollo/Emmett server generator, enabling faster builds when only parts of the model change
- Updated pipeline configs to include a DetectChanges stage between schema export and server generation
- Fixed husky pre-push hook to only check main branch divergence when actually pushing to main
