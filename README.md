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

## Structure

```
cli/          CLI and MCP tools (configure, connect, get-model, send-model)
commands/     Slash commands for your coding agent (connect, build)
skills/       Skills that teach your agent how to build from narratives
hooks/        Event hooks for the plugin lifecycle
```

## Part of the ecosystem

- **[on.auto](https://on.auto)** — the platform where you model your software as narratives
- **[narrativedriven.org](https://narrativedriven.org)** — the spec dialect that turns software behavior into a structured, reviewable model
- **[specdriven.com](https://specdriven.com)** — the category: why specifications matter now more than ever

## Community

- [Discord](https://discord.com/invite/B8BKcKMRm8) — support, discussion, and feedback
- [Auto](https://app.on.auto) — sign up and start modeling

## License

MIT · Built by [Auto](https://on.auto).
