---
description: Build application code from the current Auto narrative model
allowed-tools: Bash, auto_get_model, auto_send_model, auto_get_changes, auto_update_endpoints, mcp__chrome-devtools__navigate_page, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__list_console_messages, mcp__chrome-devtools__click, mcp__chrome-devtools__fill, mcp__chrome-devtools__evaluate_script
---

Build the application from the narrative model using vertical slice architecture.

Parse "$ARGUMENTS" to determine build scope:
- No arguments: auto-detect (incremental if changes exist, full otherwise)
- `full`: Force a full build from the complete model
- `incremental`: Only rebuild slices affected by recent changes
- A specific name (narrative, scene, or moment): Build only that target

## Pre-flight: Ensure dev servers are running

Before building, check if dev servers are already running. If not, run `/auto-agent:scaffold` first to start them. The build generates code into running servers with hot-reload — the developer should see changes live in the Auto app as you work.

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
6. **Browser verification** — after completing each scene, verify the running application:
   - If browser MCP tools are available (chrome-devtools): navigate to the frontend, take a screenshot, check for console errors, and walk through the interaction flow
   - Always test GraphQL endpoints directly: send each moment's `request` operation against `http://localhost:4000/graphql` and verify response shapes
   - If browser tools are unavailable, fall back to `curl` and suggest installing a browser MCP server
7. If any model inconsistencies are found, correct them and validate via `auto_send_model`
8. If dev servers are running, report their URLs via `auto_update_endpoints`. If the call fails due to a disconnected WebSocket, note which endpoints need to be reported — once the user reconnects (via `/auto-agent:connect`), immediately re-call `auto_update_endpoints` with those endpoints.
9. Show the **loopback URLs** returned by `auto_update_endpoints` to the user — these are the URLs that open the running app inside Auto (e.g. `https://app.on.auto/{workspaceId}/agent/{sessionId}/{label}`). Always show these instead of raw localhost URLs. The tool response contains the loopback URLs — parse and display them verbatim. For frontend apps, show the web application URL. For GraphQL APIs, show the playground. For REST APIs, show Swagger or the base API URL. If the initial call failed and you re-called after reconnection, show the loopback URLs from the successful call at that point.
10. Summarize: slices generated/updated, tests passing/failing, browser verification results, any model corrections made 🖐️
