import handler from "../pages/api/match-results"
import { NextRequest } from "next/server"
import { MatchResultService } from "../services/MatchResultService"
import { PlayerRatingStore } from "../services/PlayerRatingStore"
import { DEFAULT_RATING } from "../services/RatingService"

jest.mock("../services/MatchResultService")
jest.mock("../services/PlayerRatingStore")

const MockMatchResultService = MatchResultService as jest.MockedClass<
  typeof MatchResultService
>
const MockPlayerRatingStore = PlayerRatingStore as jest.MockedClass<
  typeof PlayerRatingStore
>

beforeEach(() => {
  jest.clearAllMocks()
  MockMatchResultService.prototype.addMatchResult.mockResolvedValue(undefined)
  MockPlayerRatingStore.prototype.getOrCreate.mockResolvedValue({
    ...DEFAULT_RATING,
    lastUpdated: Date.now(),
  })
  MockPlayerRatingStore.prototype.save.mockResolvedValue(undefined)

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

function makePost(body: object): NextRequest {
  return {
    method: "POST",
    nextUrl: new URL("https://localhost/api/match-results"),
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest
}

it("POST with winner+loser triggers rating update", async () => {
  const req = makePost({
    winner: "Alice",
    loser: "Bob",
    winnerScore: 5,
    loserScore: 2,
  })
  const res = await handler(req)
  expect(res.status).toBe(201)
  expect(MockPlayerRatingStore.prototype.getOrCreate).toHaveBeenCalledTimes(2)
  expect(MockPlayerRatingStore.prototype.save).toHaveBeenCalledTimes(2)
})

it("POST with winner only skips rating update", async () => {
  const req = makePost({ winner: "Alice", winnerScore: 5 })
  const res = await handler(req)
  expect(res.status).toBe(201)
  expect(MockPlayerRatingStore.prototype.getOrCreate).not.toHaveBeenCalled()
  expect(MockPlayerRatingStore.prototype.save).not.toHaveBeenCalled()
})

it("rating update failure does not cause 500", async () => {
  MockPlayerRatingStore.prototype.getOrCreate.mockRejectedValue(
    new Error("KV down")
  )
  const req = makePost({
    winner: "Alice",
    loser: "Bob",
    winnerScore: 5,
    loserScore: 2,
  })
  const res = await handler(req)
  expect(res.status).toBe(201)
})
