import { describe, expect, it, vi } from "vitest"
import { forward, parseSse } from "./proxy"

describe("parseSse", () => {
  it("reads data lines and ignores comments, blank lines and [DONE]", () => {
    const text = [
      ": ping",
      "event: message",
      'data: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}',
      "",
      "data: [DONE]",
    ].join("\n")

    expect(parseSse(text)).toEqual([{ jsonrpc: "2.0", id: 1, result: { ok: true } }])
  })

  it("returns nothing for an empty stream", () => {
    expect(parseSse("")).toEqual([])
  })
})

describe("forward", () => {
  it("posts the message with the bearer token and parses a JSON response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 7, result: { tools: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    )

    const out = await forward(
      { jsonrpc: "2.0", id: 7, method: "tools/list" },
      { baseUrl: "https://api.test", token: "jwt", fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    expect(out).toEqual([{ jsonrpc: "2.0", id: 7, result: { tools: [] } }])
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.test/api/mcp",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
      }),
    )
  })

  it("parses an SSE response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response('data: {"jsonrpc":"2.0","id":8,"result":{}}\n\n', {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }),
    )

    const out = await forward(
      { jsonrpc: "2.0", id: 8, method: "initialize" },
      { baseUrl: "https://api.test", token: "", fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    expect(out).toEqual([{ jsonrpc: "2.0", id: 8, result: {} }])
  })

  it("throws with the status when the endpoint refuses", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("nope", { status: 403 }))

    await expect(
      forward({ jsonrpc: "2.0", id: 9 }, { baseUrl: "https://api.test", fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow(/403/)
  })
})
