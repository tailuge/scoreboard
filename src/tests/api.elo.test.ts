import handler from "../pages/api/elo"
import { NextRequest } from "next/server"
import { PlayerRatingStore } from "../services/PlayerRatingStore"

jest.mock("../services/PlayerRatingStore")
const MockStore = PlayerRatingStore as jest.MockedClass<
  typeof PlayerRatingStore
>

beforeEach(() => {
  jest.clearAllMocks()
  const mockResponseConstructor = jest.fn((body, init) => ({
    status: init?.status || 200,
    json: () => Promise.resolve(JSON.parse(body)),
  })) as any
  mockResponseConstructor.json = jest.fn((data, init) => ({
    status: init?.status || 200,
    json: () => Promise.resolve(data),
  }))
  globalThis.Response = mockResponseConstructor
})

function makeGet(url: string): NextRequest {
  return { method: "GET", nextUrl: new URL(url) } as unknown as NextRequest
}

it("returns 400 for invalid ruleType", async () => {
  const res = await handler(
    makeGet("https://localhost/api/elo?ruleType=invalid")
  )
  expect(res.status).toBe(400)
})

it("returns sorted player list", async () => {
  const players = [
    {
      name: "Alice",
      rating: 1600,
      rd: 50,
      conservativeRating: 1500,
      gamesPlayed: 10,
      wins: 7,
      losses: 3,
    },
    {
      name: "Bob",
      rating: 1400,
      rd: 30,
      conservativeRating: 1340,
      gamesPlayed: 5,
      wins: 2,
      losses: 3,
    },
  ]
  MockStore.prototype.getTopN.mockResolvedValue(players)

  const res = await handler(
    makeGet("https://localhost/api/elo?ruleType=nineball")
  )
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual(players)
  expect(MockStore.prototype.getTopN).toHaveBeenCalledWith("nineball", 10)
})

it("returns empty array when no data", async () => {
  MockStore.prototype.getTopN.mockResolvedValue([])
  const res = await handler(makeGet("https://localhost/api/elo"))
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data).toEqual([])
})
