---
name: auto-scaffold
description: Scaffold and start a skeleton React + Apollo GraphQL application with dev servers running immediately. Creates a welcome page and health check endpoint, then reports endpoints to the Auto app.
version: 0.1.0
---

# Scaffold Skill

Immediately scaffold a running application so the developer can see progress in the Auto app from the moment the agent connects.

## How It Works

Read the stack configuration from `.auto-agent/config.json` (the `stack` field). Defaults if not set:

| Setting      | Default            |
|--------------|--------------------|
| `frontend`   | `react-vite`       |
| `backend`    | `apollo-graphql`   |
| `clientDir`  | `client`           |
| `serverDir`  | `server`           |

## Steps

### 1. Check existing state

If `client/` and `server/` (or the configured directories) already exist with `node_modules/`, skip scaffolding and jump to step 5 (start servers). The project is already set up.

### 2. Scaffold the frontend (`react-vite`)

Create a Vite + React + TypeScript project in the configured `clientDir`:

```bash
npm create vite@latest <clientDir> -- --template react-ts
cd <clientDir> && npm install
```

Install additional dependencies:
```bash
npm install @apollo/client graphql @json-render/core @json-render/react @on.auto/ui-components
npm install -D tailwindcss @tailwindcss/vite
```

Set up Tailwind CSS (check installed version for correct config approach).

**Create a welcome page** (`src/App.tsx`) that:
- Shows the workspace name (from the model if available, otherwise "Your App")
- Has a clean, premium design following the design patterns in `references/design-patterns.md`
- Uses a Soft Structuralism vibe: light background, bold typography, floating card with diffused shadow
- Includes a status indicator showing connection to the backend (pings the health check)
- Is responsive and looks great immediately

### 3. Scaffold the backend (`apollo-graphql`)

Create an Apollo Server project in the configured `serverDir`:

```bash
mkdir -p <serverDir> && cd <serverDir>
npm init -y
npm install @apollo/server graphql graphql-tag cors express
npm install -D typescript @types/node @types/cors @types/express tsx
```

Create a minimal TypeScript config and entry point (`src/index.ts`) with:
- An Apollo Server with Express middleware
- A `health` query that returns `{ status: "ok", timestamp: <ISO string> }`
- CORS enabled for the frontend origin (`http://localhost:5173`)
- Listening on port 4000

The schema:
```graphql
type Query {
  health: HealthCheck!
}

type HealthCheck {
  status: String!
  timestamp: String!
}
```

### 4. Configure dev scripts

**Frontend** (`client/package.json`):
- `dev` script should use Vite with `--host` flag so it's accessible

**Backend** (`server/package.json`):
- Add a `dev` script: `tsx watch src/index.ts`
- This watches for file changes and restarts automatically

### 5. Start both dev servers

Start both servers in the background so they run while the agent continues working:

```bash
cd <clientDir> && npm run dev &
cd <serverDir> && npm run dev &
```

Wait a few seconds, then verify both are running:
- Frontend: `curl -s http://localhost:5173 | head -5`
- Backend: `curl -s http://localhost:4000/graphql -H 'Content-Type: application/json' -d '{"query":"{ health { status } }"}'`

### 6. Report endpoints

Call `auto_update_endpoints` with:
```json
[
  { "label": "Frontend", "url": "http://localhost:5173" },
  { "label": "GraphQL Playground", "url": "http://localhost:4000/graphql" }
]
```

Display the returned loopback URLs to the developer. These are the URLs they'll use to preview inside the Auto app.

### 7. Confirm

Tell the developer:
- Both servers are running in dev/watch mode
- Changes will hot-reload as code is generated
- Show the Auto app preview URLs (loopback URLs from step 6)
- The build skill will now generate code into these running servers

### 7.5. Generate theme CSS from model

Call `auto_get_design` and generate a `theme.css` file in the frontend `src/` directory with CSS custom properties from:
- `theme.colors.light` → `--surface-page`, `--primary`, `--fg`, etc.
- `theme.radius` → `--radius-sm`, `--radius-md`, etc.
- `theme.shadow` → `--shadow-sm`, `--shadow-card`, etc.
- `theme.font` → `--font-sans`, `--font-mono`

Import this CSS in the app entry point (`main.tsx`). The model's theme is authoritative for all styling.

## Design Guidelines

When the model has a `design.theme`, use it as the authoritative style source (see `references/design-patterns.md` section 0). When no model theme exists, fall back to:

- Use `Geist` or `Satoshi` font (install via Google Fonts or Fontsource)
- Neutral Zinc/Slate palette with one accent color
- Double-Bezel card for the main content area
- Subtle scroll entry animation on load
- `min-h-[100dvh]` for the page container
- Responsive: single-column on mobile
- Custom cubic-bezier transitions
- No emojis, no generic AI aesthetic

## Extending

Developers can customize this skill by editing it in their `.auto-agent/` directory. To change the default stack, edit `.auto-agent/config.json`:

```json
{
  "stack": {
    "frontend": "react-vite",
    "backend": "apollo-graphql",
    "clientDir": "client",
    "serverDir": "server"
  }
}
```

Future stack options may include `next`, `remix`, `hono`, etc.
