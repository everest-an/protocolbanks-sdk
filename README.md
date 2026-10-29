# Protocol Banks SDK

The **open client surface** for the [Protocol Banks Agent API](https://protocolbanks.com/agent-api): one credential, one server-enforced policy, five endpoints. MIT licensed.

The execution service — policy enforcement, risk engine, order execution, key custody — is proprietary and hosted at [protocolbanks.com](https://protocolbanks.com). Everything in this repository is the client side; it talks to the public API.

## Packages

| Package | What it does |
|---|---|
| [`@everestan/protocolbanks-sdk`](packages/sdk) | The client: `state`, `order`, `pay`, `swap`, `invoice`, `invoiceStatus` |
| [`@everestan/protocolbanks-agent-tools`](packages/agent-tools) | A JSON-Schema tool manifest for the Vercel AI SDK, LangChain, OpenAI and Anthropic |
| [`@everestan/protocolbanks-mcp`](packages/mcp-proxy) | A stdio MCP client that proxies to the hosted MCP server |

```bash
npm install @everestan/protocolbanks-sdk
```

```ts
import { ProtocolBanks } from "@everestan/protocolbanks-sdk"

const pb = new ProtocolBanks({ apiKey: process.env.PB_KEY! })

const state = await pb.agent.state()
const order = await pb.agent.order({ coin: "BTC", side: "long", sizeUsd: 20 })

// Refusals are returned with the HTTP status — they are not exceptions.
if (!order.ok) console.log(order.status, order.error) // 403 policy · 409 guard
```

## Tool manifest

```ts
import { agentTools, toOpenAIFunctions } from "@everestan/protocolbanks-agent-tools"

const tools = agentTools(pb)
// agent_state · place_order · prepare_payment · prepare_swap · create_invoice
```

Only `place_order` executes. The descriptions tell the model not to retry a `403`/`409`.

## MCP

```json
{
  "mcpServers": {
    "protocol-banks": {
      "command": "npx",
      "args": ["-y", "@everestan/protocolbanks-mcp"],
      "env": { "PB_BASE": "https://protocolbanks.com", "PB_TOKEN": "<optional wallet JWT>" }
    }
  }
}
```

Public read/quote tools work without a token; account and trading tools need a wallet session token. See [`packages/mcp-proxy`](packages/mcp-proxy).

## Framework examples

Runnable starters live in [`integrations/`](integrations): Vercel AI SDK, Mastra, elizaOS. They are examples, not published from this workspace.

## Documentation

- Docs (EN): https://protocolbanks.com/docs
- Docs (中文): https://protocolbanks.com/zh/docs
- API reference: https://protocolbanks.com/docs/api
- Contract: https://protocolbanks.com/api/agent.openapi.json

## Security

The SDK never sees a private key. Trading happens through an agent wallet with trading-only rights; the platform holds no funds. Report issues privately via the contact page.

## License

MIT — see [LICENSE](LICENSE). The hosted service is not covered by this license.
