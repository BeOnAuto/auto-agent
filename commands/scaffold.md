---
description: Scaffold and start skeleton dev servers for immediate preview
allowed-tools: Bash, auto_get_model, auto_update_endpoints
---

Scaffold a running application skeleton with dev servers so the developer gets immediate preview in the Auto app.

## Steps

1. Read the stack configuration from `.auto-agent/config.json` (the `stack` field). Use defaults if not set: `react-vite` frontend in `client/`, `apollo-graphql` backend in `server/`.

2. If the project directories already exist with `node_modules/`, skip scaffolding — just start the servers.

3. Follow the auto-scaffold skill to:
   - Create a Vite + React + TypeScript frontend with a premium welcome page
   - Create an Apollo Server backend with a health check endpoint
   - Install all dependencies
   - Apply design patterns from `references/design-patterns.md` to the welcome page

4. Start both dev servers in watch mode (background processes):
   - Frontend: `npm run dev` in the client directory (Vite with HMR)
   - Backend: `npm run dev` in the server directory (tsx watch)

5. Verify both servers are responding:
   - `curl -s http://localhost:5173`
   - `curl -s http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{"query":"{ health { status } }"}'`

6. Call `auto_update_endpoints` with the running server URLs

7. Show the loopback URLs returned by `auto_update_endpoints` — these preview inside the Auto app

8. Optionally, call `auto_get_model` to peek at the workspace name for the welcome page title

If "$ARGUMENTS" contains `--skip-frontend` or `--skip-backend`, only scaffold the specified side.
