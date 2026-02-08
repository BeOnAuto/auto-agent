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
"@auto-engineer/narrative": minor
"@auto-engineer/pipeline": minor
"@auto-engineer/release-automation": minor
"@auto-engineer/server-checks": minor
"@auto-engineer/server-generator-apollo-emmett": minor
"@auto-engineer/server-generator-nestjs": minor
"@auto-engineer/server-implementer": minor
"create-auto-app": minor
---

- Added ProcessJobGraph command handler for processing job dependency graphs as a pipeline plugin
- Exported COMMANDS array for automatic plugin discovery
- Wired job-graph-processor plugin into the typical example project
- Added end-to-end tests for ProcessJobGraph via PipelineServer
- Added README with pipeline integration documentation
