---
description: Connect to your Auto workspace with an API key
---

Connect to the Auto collaboration server using the provided API key.

Use the `auto_configure` MCP tool to save the API key:

1. Call the `auto_configure` tool with the key: "$ARGUMENTS"
2. Confirm the connection was successful
3. Tell the user they are now connected and can use Auto tools

If no key was provided, tell the user they need to provide an API key:
- They can find their API key in the Auto app under "Coding Agent" in the sidebar
- Usage: `/auto-agent:connect <api-key>`
