# @everestan/protocolbanks-mcp

A stdio MCP client for the hosted Protocol Banks MCP server. It forwards
JSON-RPC to `https://protocolbanks.com/api/mcp`; the tools live on the server.

```bash
npx -y @everestan/protocolbanks-mcp
```

| Env | Required | Meaning |
|---|---|---|
| `PB_BASE` | no | platform origin, default `https://protocolbanks.com` |
| `PB_TOKEN` | optional | wallet session JWT; public read/quote tools work without it |

Claude Desktop / Claude Code / Cursor:

```json
{
  "mcpServers": {
    "protocol-banks": {
      "command": "npx",
      "args": ["-y", "@everestan/protocolbanks-mcp"],
      "env": { "PB_TOKEN": "<wallet session token>" }
    }
  }
}
```

Why a proxy: the hosted server speaks Streamable HTTP; some MCP hosts still
launch a stdio command. This bridges the two without reimplementing any tool.

Account and trading tools require a wallet session token (`PB_TOKEN`). The
trading wallet has trading-only rights; it can place and cancel orders, never
withdraw.
