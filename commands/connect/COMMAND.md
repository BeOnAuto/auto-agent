---
description: Connect to your Auto workspace with an API key
---

Connect to the Auto collaboration server using the provided API key.

Parse "$ARGUMENTS" to extract the key and optional server URL. The format is:
- Key only: `/auto-agent:connect ak_workspace_secret`
- Key + server: `/auto-agent:connect ak_workspace_secret --server http://localhost:8787`

Use the `auto_configure` MCP tool to save the configuration:

1. Call `auto_configure` with the `key` parameter, and optionally the `server` parameter if provided
2. Confirm the connection was successful
3. Tell the user they are now connected and can use Auto tools

If no key was provided, tell the user they need to provide an API key:
- They can find their API key in the Auto app under "Coding Agent" in the sidebar
- Usage: `/auto-agent:connect <api-key>` or `/auto-agent:connect <api-key> --server <url>`
