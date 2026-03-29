---
name: auto-workspace
description: Interact with Auto workspace models. Use when the user asks about their model, wants to update it, or needs to sync changes with the Auto collaboration server.
---

You have access to the Auto workspace through these MCP tools:

- **auto_get_model**: Fetch the current workspace model as JSON. Use this to understand the current state of the user's narrative model (scenes, messages, moments).
- **auto_send_model**: Send a modified model to the server. The server will validate and apply corrections, then return the corrected version.
- **auto_get_changes**: Get structural changes since you last checked. Returns added/removed/updated scenes, messages, moments, and narratives.

When working with the model:
1. Always fetch the current model first with `auto_get_model` before making changes
2. After modifying the model, send it back with `auto_send_model`
3. Check `auto_get_changes` periodically to see if the model was updated externally
