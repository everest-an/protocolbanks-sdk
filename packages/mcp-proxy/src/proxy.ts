/**
 * A thin stdio ↔ Streamable HTTP bridge for the hosted Protocol Banks MCP
 * server. It does not implement tools; it forwards JSON-RPC to
 * `${PB_BASE}/api/mcp` and writes the responses back.
 */
export interface JsonRpcMessage {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  [key: string]: unknown
}

export interface ForwardOptions {
  baseUrl?: string
  /** Wallet session JWT for account/trading tools. Public tools work without it. */
  token?: string
  fetchImpl?: typeof fetch
}

/** Extract JSON-RPC messages from an SSE body (one `data:` line per message). */
export function parseSse(text: string): JsonRpcMessage[] {
  const messages: JsonRpcMessage[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("data:")) continue
    const data = trimmed.slice(5).trim()
    if (!data || data === "[DONE]") continue
    try {
      messages.push(JSON.parse(data) as JsonRpcMessage)
    } catch {
      // Ignore keep-alives and non-JSON data lines.
    }
  }
  return messages
}

/** POST one JSON-RPC message and return the response messages. */
export async function forward(message: unknown, options: ForwardOptions = {}): Promise<JsonRpcMessage[]> {
  const base = (options.baseUrl ?? process.env.PB_BASE ?? "https://protocolbanks.com").replace(/\/+$/, "")
  const token = options.token ?? process.env.PB_TOKEN
  const doFetch = options.fetchImpl ?? fetch

  const response = await doFetch(`${base}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(message),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`MCP request failed (${response.status}): ${text.slice(0, 300)}`)
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("text/event-stream")) return parseSse(text)
  if (!text.trim()) return []

  try {
    return [JSON.parse(text) as JsonRpcMessage]
  } catch {
    return parseSse(text)
  }
}
