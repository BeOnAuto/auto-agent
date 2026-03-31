<p align="center">
  <a href="https://on.auto">
    <img src="https://on.auto/og-image.png" alt="Auto — Don't just prompt. Specify." width="600" />
  </a>
</p>

<h3 align="center">Connect your coding agent to Auto.</h3>

<p align="center">
  <a href="https://on.auto"><strong>on.auto</strong></a> ·
  <a href="https://on.auto/how-it-works">How It Works</a> ·
  <a href="https://narrativedriven.org">Narrative-Driven Development</a> ·
  <a href="https://specdriven.com">Spec-Driven Development</a> ·
  <a href="https://discord.com/invite/B8BKcKMRm8">Discord</a>
</p>

---

The Auto Agent plugin connects your coding agent to the [Auto](https://on.auto) platform. Model your software as [narratives](https://narrativedriven.org/what-is-ndd) on Auto, then let your coding agent build from the structured model on your machine.

Works with Claude Code today. More agents coming soon.

## What it does

- **Syncs the narrative model** from your Auto workspace to your coding agent
- **Teaches your agent how to build** from structured specs, not vague prompts
- **Validates changes** — if your agent modifies the model, Auto checks it against 50+ structural rules and corrects anything off-spec
- **Incremental builds** — change the narrative, rebuild only what's affected

## Quick start

Inside Claude Code:

```
/plugin marketplace add BeOnAuto/auto-plugins
/plugin install auto-agent
/reload-plugins
```

Then connect with your API key (find it in the Auto app under **Agents** in the sidebar):

```
/auto-agent:connect <your-api-key>
```

Build your app:

```
/auto-agent:build
```

## How it works

1. **Model on Auto** — describe your app, Auto generates a structured narrative with scenes, moments, UI specs, and business rules
2. **Connect your agent** — install the plugin, connect with your API key
3. **Build** — your agent receives the validated model and builds the application locally
4. **Iterate** — modify the narrative on Auto, the model syncs instantly, rebuild what changed

Your coding agent does the implementation. Auto keeps it honest.

## Transparency

This plugin is fully open source. Here's exactly what it does and what it doesn't do.

### What the plugin accesses

| What | Direction | Purpose |
|------|-----------|---------|
| Your narrative model | Auto → your machine | Syncs your specifications so your agent can build from them |
| Model corrections | Your machine → Auto | Sends structural fixes back so your model stays valid |
| Dev server URLs | Your machine → Auto | Reports `localhost` endpoints so you can preview your app inside Auto |
| API key | Stored locally | Authenticates your agent to your workspace |

### What it does NOT do

- **No code is uploaded.** Your source code never leaves your machine.
- **No telemetry.** No usage tracking, no analytics, no phone-home.
- **No filesystem scanning.** The plugin only reads/writes inside `.auto-agent/` in your project.
- **No network calls beyond your Auto workspace.** All communication goes to the Auto API you connected to — nothing else.

### Source files

The entire plugin logic lives in a handful of files:

| File | What it does |
|------|-------------|
| [`cli/src/mcp/tools.ts`](cli/src/mcp/tools.ts) | The 5 MCP tools — the only interface between your agent and Auto |
| [`cli/src/connection.ts`](cli/src/connection.ts) | WebSocket sync — how model updates flow in real time |
| [`cli/src/client.ts`](cli/src/client.ts) | HTTP client — every network call the plugin makes |
| [`cli/src/persistence.ts`](cli/src/persistence.ts) | Local file cache — what gets written to disk |
| [`commands/`](commands/) | Slash commands (`connect` and `build`) |
| [`skills/`](skills/) | Build instructions — how your agent turns specs into code |
| [`hooks/`](hooks/) | Session-start hook that provides workspace context |

### How the data flows

```
Auto Workspace (cloud)
    ↕ WebSocket (model sync)
Plugin (your machine)
    ↕ MCP tools (local only)
Your Coding Agent (Claude Code)
    → builds code locally
```

The plugin is a bridge between your Auto workspace and your local coding agent. It never touches your source code — it only passes the narrative model and build instructions.

## Part of the ecosystem

- **[on.auto](https://on.auto)** — the platform where you model your software as narratives
- **[narrativedriven.org](https://narrativedriven.org)** — the spec dialect that turns software behavior into a structured, reviewable model
- **[specdriven.com](https://specdriven.com)** — the category: why specifications matter now more than ever

## Community

- [Discord](https://discord.com/invite/B8BKcKMRm8) — support, discussion, and feedback
- [Auto](https://app.on.auto) — sign up and start modeling

## License

MIT · Built by [Auto](https://on.auto).
