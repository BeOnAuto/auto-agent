---
description: Build application code from the current Auto narrative model
allowed-tools: Bash, auto_get_model, auto_send_model, auto_get_changes, auto_update_endpoints
---

Build the application from the narrative model using vertical slice architecture.

Parse "$ARGUMENTS" to determine build scope:
- No arguments: auto-detect (incremental if changes exist, full otherwise)
- `full`: Force a full build from the complete model
- `incremental`: Only rebuild slices affected by recent changes
- A specific name (narrative, scene, or moment): Build only that target

## Steps

1. Call `auto_get_model` to fetch the current model
2. Call `auto_get_changes` to check for pending deltas
3. Determine build scope:
   - If `$ARGUMENTS` specifies a target, build only that slice/scene/narrative
   - If changes exist and not forced full, do an incremental build of affected slices
   - Otherwise, do a full build from the complete model
4. Follow the auto-build skill for all code generation:
   - Generate shared GraphQL schema and types from model messages
   - For each moment: create server handler, client component, and tests
   - For each scene: create acceptance tests
5. Run all tests for the affected scope
6. If any model inconsistencies are found, correct them and validate via `auto_send_model`
7. If dev servers are running, report their URLs via `auto_update_endpoints`
8. Summarize: slices generated/updated, tests passing/failing, any model corrections made
