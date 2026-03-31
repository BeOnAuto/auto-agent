# Ketchup Plan: Add File Logger to Auto-Agent

## TODO

- [ ] Burst 1: Create logger module that writes to `.auto-agent/auto-agent.log` [depends: none]
- [ ] Burst 2: Add logging to MCP server startup (server.ts) [depends: 1]
- [ ] Burst 3: Add logging to daemon startup (daemon.ts) [depends: 1]
- [ ] Burst 4: Add logging to ConnectionManager (connection.ts) [depends: 1]
- [ ] Burst 5: Add logging to MCP tools (tools.ts) [depends: 1]
- [ ] Burst 6: Add logging to persistence operations (persistence.ts) [depends: 1]
- [ ] Burst 7: Add logging to client HTTP calls (client.ts) [depends: 1]
- [ ] Burst 8: Add logging to CLI commands (configure.ts, connect.ts) [depends: 1]
- [ ] Burst 9: Add global uncaught exception/rejection handlers in server startup [depends: 1]

## DONE
