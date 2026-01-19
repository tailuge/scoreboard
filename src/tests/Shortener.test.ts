import { Shortener } from "@/services/shortener"
import { mockKv } from "./mockkv"
import { VercelKV } from "@vercel/kv"

describe("Shortener", () => {
  let shortener: Shortener

  beforeEach(async () => {
    // Cast mockKv to ANY to bypass strict type checks for the test setup if needed,
    // or just assume it matches VercelKV enough for runtime
    shortener = new Shortener(mockKv as unknown as VercelKV)
    await mockKv.flushall!()
  })

  it("should generate a short key and store data", async () => {
    const data = { input: "game-replay-data" }

    // First call to incr should return 1
    const result = await shortener.shorten(data)

    expect(result.key).toBe("1")
    expect(result.input).toBe("game-replay-data")
    expect(result.shortUrl).toContain("/api/replay/1")

    // Verify it's in the store
    const stored = await mockKv.get!("urlkey1")
    expect(stored).toEqual(data)
  })

  it("should increment keys on subsequent calls", async () => {
    await shortener.shorten({ input: "first" })
    const result = await shortener.shorten({ input: "second" })

    expect(result.key).toBe("2")
    const stored = await mockKv.get!("urlkey2")
    expect(stored).toEqual({ input: "second" })
  })

  it("should replay existing keys", async () => {
    // Manually verify setup or via shorten
    await shortener.shorten({ input: "replay-me" })

    const replayUrl = await shortener.replay("1")
    expect(replayUrl).toContain("tailuge.github.io/billiards/dist/replay-me")
  })

  it("should return not found for invalid keys", async () => {
    const replayUrl = await shortener.replay("999")
    expect(replayUrl).toContain("notfound.html")
  })
})
