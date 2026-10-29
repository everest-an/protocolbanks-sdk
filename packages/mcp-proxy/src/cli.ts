#!/usr/bin/env node
/**
 * stdio MCP server that forwards to the hosted Protocol Banks endpoint.
 *
 *   PB_TOKEN=… npx @everestan/protocolbanks-mcp
 *
 * Public tools work without PB_TOKEN; account and trading tools need a wallet
 * session token. PB_BASE defaults to https://protocolbanks.com.
 */
import { createInterface } from "node:readline"
import { forward } from "./proxy.js"

const input = createInterface({ input: process.stdin, crlfDelay: Infinity })
let chain: Promise<void> = Promise.resolve()

async function handle(line: string): Promise<void> {
  const trimmed = line.trim()
  if (!trimmed) return

  let message: unknown
  try {
    message = JSON.parse(trimmed)
  } catch {
    return
  }

  try {
    const responses = await forward(message)
    for (const response of responses) {
      process.stdout.write(JSON.stringify(response) + "\n")
    }
  } catch (error) {
    const id = (message as { id?: unknown }).id ?? null
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: error instanceof Error ? error.message : String(error) },
      }) + "\n",
    )
  }
}

input.on("line", (line) => {
  chain = chain.then(() => handle(line))
})

input.on("close", () => {
  chain.then(() => process.exit(0))
})
