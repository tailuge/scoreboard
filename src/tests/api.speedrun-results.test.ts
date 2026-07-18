import mainHandler from "../pages/api/speedrun-results"
import replayHandler from "../pages/api/speedrun-results/[id]"
import { NextRequest } from "next/server"
import { GAME_BASE_URL } from "../config"

// In-memory store to mock @vercel/kv
const memoryStore: Record<string, any> = {}

// Mock globalThis.Response for jsdom (following existing test patterns)
beforeAll(() => {
  const mockResponseConstructor = jest.fn((body, init) => {
    const headers = new Map<string, string>()
    if (init?.headers) {
      if (init.headers instanceof Map) {
        init.headers.forEach((v, k) => headers.set(k, v))
      } else if (typeof init.headers === "object") {
        Object.entries(init.headers).forEach(([k, v]) =>
          headers.set(k, v as string)
        )
      }
    }
    return {
      status: init?.status || 200,
      headers: {
        get: (name: string) => headers.get(name) || null,
      },
      json: () => Promise.resolve(JSON.parse(body || "null")),
      text: () => Promise.resolve(body || ""),
    }
  }) as any

  mockResponseConstructor.json = jest.fn((data, init) => {
    const headers = new Map<string, string>()
    if (init?.headers) {
      Object.entries(init.headers).forEach(([k, v]) =>
        headers.set(k, v as string)
      )
    }
    return {
      status: init?.status || 200,
      headers: {
        get: (name: string) => headers.get(name) || null,
      },
      json: () => Promise.resolve(data),
    }
  })

  mockResponseConstructor.redirect = jest.fn((url, status) => {
    const headers = new Map<string, string>()
    headers.set("Location", url)
    return {
      status: status || 307,
      headers: {
        get: (name: string) => headers.get(name) || null,
      },
    }
  })

  globalThis.Response = mockResponseConstructor
})

jest.mock("@vercel/kv", () => ({
  kv: {
    get: jest.fn(async (key: string) => {
      const value = memoryStore[key]
      if (value === undefined || value === null) return null
      return JSON.parse(JSON.stringify(value)) // deep clone
    }),
    set: jest.fn(async (key: string, value: any) => {
      memoryStore[key] = JSON.parse(JSON.stringify(value)) // deep clone
      return "OK"
    }),
  },
}))

import { kv } from "@vercel/kv"

const mockKv = kv as jest.Mocked<typeof kv>

describe("/api/speedrun-results handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear in-memory store
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key]
    }
  })

  describe("GET", () => {
    it("returns empty array when no leaderboard data exists", async () => {
      const req = {
        method: "GET",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it("returns flattened leaderboard with positionId on each entry", async () => {
      memoryStore["speedrun-leaderboard"] = {
        "nineball-break": [
          {
            id: "abc123",
            playerName: "Alice",
            timeSec: 12.45,
            ruleType: "nineball",
            date: "2026-07-04T12:00:00Z",
          },
        ],
        "snooker-clear": [
          {
            id: "def456",
            playerName: "Bob",
            timeSec: 45.0,
            ruleType: "snooker",
            date: "2026-07-04T12:05:00Z",
          },
        ],
      }

      const req = {
        method: "GET",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0]).toMatchObject({
        id: "abc123",
        positionId: "nineball-break",
      })
      expect(data[1]).toMatchObject({
        id: "def456",
        positionId: "snooker-clear",
      })
    })

    it("includes Cache-Control header", async () => {
      const req = {
        method: "GET",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=30")
    })
  })

  describe("POST", () => {
    it("adds a new entry and returns updated position", async () => {
      const body = {
        positionId: "nineball-break",
        playerName: "Alice",
        timeSec: 12.45,
        ruleType: "nineball",
        state: "crushed-replay-string",
      }

      const req = {
        method: "POST",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        playerName: "Alice",
        timeSec: 12.45,
        ruleType: "nineball",
      })
      expect(data[0].id).toEqual(expect.any(String))
      expect(data[0].date).toEqual(expect.any(String))
    })

    it("saves replay state to speedrun-states KV key", async () => {
      const body = {
        positionId: "nineball-break",
        playerName: "Alice",
        timeSec: 12.45,
        ruleType: "nineball",
        state: "crushed-replay-string",
      }

      const req = {
        method: "POST",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest

      await mainHandler(req)

      const states = memoryStore["speedrun-states"]
      expect(states).toBeDefined()
      const stateKeys = Object.keys(states)
      expect(stateKeys).toHaveLength(1)
      expect(Object.values(states)[0]).toBe("crushed-replay-string")
    })

    it("does not save replay state for entries evicted from top 3", async () => {
      // Pre-populate with 3 existing entries (fast times)
      memoryStore["speedrun-leaderboard"] = {
        "nineball-break": [
          {
            id: "fast1",
            playerName: "Fast1",
            timeSec: 10.0,
            ruleType: "nineball",
            date: "2026-07-01T00:00:00Z",
          },
          {
            id: "fast2",
            playerName: "Fast2",
            timeSec: 11.0,
            ruleType: "nineball",
            date: "2026-07-02T00:00:00Z",
          },
          {
            id: "fast3",
            playerName: "Fast3",
            timeSec: 12.0,
            ruleType: "nineball",
            date: "2026-07-03T00:00:00Z",
          },
        ],
      }

      const body = {
        positionId: "nineball-break",
        playerName: "Slow",
        timeSec: 99.0,
        ruleType: "nineball",
        state: "should-not-be-saved",
      }

      const req = {
        method: "POST",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      const data = await response.json()

      // The slow entry should be evicted — only 3 kept entries from the original set
      expect(data).toHaveLength(3)
      const ids = data.map((e: any) => e.id)
      expect(ids).toEqual(["fast1", "fast2", "fast3"])

      // States should not contain the new entry's state
      const states = memoryStore["speedrun-states"] || {}
      const stateValues = Object.values(states)
      expect(stateValues).not.toContain("should-not-be-saved")
    })

    it("evicts 4th entry and cleans up evicted replay state", async () => {
      // Pre-populate with states for an entry that will be evicted
      memoryStore["speedrun-states"] = {
        slow1: "slow-state",
      }

      memoryStore["speedrun-leaderboard"] = {
        "nineball-break": [
          {
            id: "fast1",
            playerName: "Fast1",
            timeSec: 10.0,
            ruleType: "nineball",
            date: "2026-07-01T00:00:00Z",
          },
          {
            id: "fast2",
            playerName: "Fast2",
            timeSec: 11.0,
            ruleType: "nineball",
            date: "2026-07-02T00:00:00Z",
          },
          {
            id: "slow1",
            playerName: "Slow1",
            timeSec: 50.0,
            ruleType: "nineball",
            date: "2026-07-03T00:00:00Z",
          },
        ],
      }

      const body = {
        positionId: "nineball-break",
        playerName: "Medium",
        timeSec: 15.0,
        ruleType: "nineball",
        state: "medium-state",
      }

      const req = {
        method: "POST",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      const data = await response.json()

      // Should have 3 entries: fast1 (10), fast2 (11), medium (15)
      expect(data).toHaveLength(3)
      const ids = data.map((e: any) => e.id)
      expect(ids).toContain("fast1")
      expect(ids).toContain("fast2")
      expect(ids).not.toContain("slow1")

      // Evicted entry's state should be removed
      const states = memoryStore["speedrun-states"] || {}
      expect(states["slow1"]).toBeUndefined()
    })

    it("keeps tied entries even if it means more than 3 per position", async () => {
      memoryStore["speedrun-leaderboard"] = {
        "nineball-break": [
          {
            id: "fast1",
            playerName: "Fast1",
            timeSec: 10.0,
            ruleType: "nineball",
            date: "2026-07-01T00:00:00Z",
          },
          {
            id: "fast2",
            playerName: "Fast2",
            timeSec: 10.0,
            ruleType: "nineball",
            date: "2026-07-02T00:00:00Z",
          },
          {
            id: "fast3",
            playerName: "Fast3",
            timeSec: 12.0,
            ruleType: "nineball",
            date: "2026-07-03T00:00:00Z",
          },
        ],
      }

      const body = {
        positionId: "nineball-break",
        playerName: "AlsoFast",
        timeSec: 10.0,
        ruleType: "nineball",
        state: "also-fast-state",
      }

      const req = {
        method: "POST",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
        json: jest.fn().mockResolvedValue(body),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      const data = await response.json()

      // All 3 entries at 10.0 should be kept (tied), plus fast3 at 12.0 = 4 entries
      expect(data).toHaveLength(4)
      const timeValues = data.map((e: any) => e.timeSec)
      expect(timeValues).toEqual([10.0, 10.0, 10.0, 12.0])
    })

    it("returns 405 for unsupported methods", async () => {
      const req = {
        method: "PUT",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      expect(response.status).toBe(405)
    })

    it("returns 500 on unexpected error during POST", async () => {
      // Cause kv.get to throw
      ;(mockKv.get as jest.Mock).mockRejectedValueOnce(new Error("KV error"))

      const req = {
        method: "POST",
        nextUrl: new URL("https://localhost/api/speedrun-results"),
        json: jest.fn().mockResolvedValue({
          positionId: "test",
          playerName: "Test",
          timeSec: 1,
        }),
      } as unknown as NextRequest

      const response = await mainHandler(req)
      expect(response.status).toBe(500)
    })
  })
})

describe("/api/speedrun-results/[id] handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key]
    }
  })

  it("returns 405 for non-GET methods", async () => {
    const req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/speedrun-results/abc123"),
    } as unknown as NextRequest

    const response = await replayHandler(req)
    expect(response.status).toBe(405)
  })

  it("returns 400 if ID is missing from pathname", async () => {
    const req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/speedrun-results/"),
    } as unknown as NextRequest

    const response = await replayHandler(req)
    expect(response.status).toBe(400)
  })

  it("returns 404 if entry not found in leaderboard", async () => {
    const req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/speedrun-results/nonexistent"),
    } as unknown as NextRequest

    const response = await replayHandler(req)
    expect(response.status).toBe(404)
  })

  it("returns 404 if replay state not found", async () => {
    memoryStore["speedrun-leaderboard"] = {
      "nineball-break": [
        {
          id: "abc123",
          playerName: "Alice",
          timeSec: 12.45,
          ruleType: "nineball",
          date: "2026-07-04T12:00:00Z",
        },
      ],
    }
    // No states stored

    const req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/speedrun-results/abc123"),
    } as unknown as NextRequest

    const response = await replayHandler(req)
    expect(response.status).toBe(404)
  })

  it("redirects to replay URL on success", async () => {
    memoryStore["speedrun-leaderboard"] = {
      "nineball-break": [
        {
          id: "abc123",
          playerName: "Alice",
          timeSec: 12.45,
          ruleType: "nineball",
          date: "2026-07-04T12:00:00Z",
        },
      ],
    }
    memoryStore["speedrun-states"] = {
      abc123: "crushed-replay-string",
    }

    const req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/speedrun-results/abc123"),
    } as unknown as NextRequest

    const response = await replayHandler(req)

    // Response.redirect creates a redirect response
    expect(response.status).toBe(307)
    const location = response.headers.get("Location")
    expect(location).toContain(GAME_BASE_URL)
    expect(location).toContain("ruletype=nineball")
    expect(location).toContain("state=crushed-replay-string")
  })

  it("returns 500 on unexpected error", async () => {
    ;(mockKv.get as jest.Mock).mockRejectedValueOnce(new Error("KV error"))

    const req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/speedrun-results/abc123"),
    } as unknown as NextRequest

    const response = await replayHandler(req)
    expect(response.status).toBe(500)
  })
})
