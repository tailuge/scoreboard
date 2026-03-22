import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import Game from "../pages/game"
import { setupUserMock, createFetchMock, mockFetchResponse } from "./testUtils"
import { useMessaging } from "@/contexts/MessagingContext"
import { useUser } from "@/contexts/UserContext"

jest.mock("@/contexts/UserContext", () => ({ useUser: jest.fn() }))
jest.mock("@/contexts/MessagingContext", () => ({
  useMessaging: jest.fn(),
}))

describe("Challenge Logic", () => {
  const mockUserId = "user-123"
  const mockUserName = "Alice"
  const mockOpponentId = "user-456"
  const mockOpponentName = "Bob"
  let mockRedirectUrl = ""

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUser as jest.Mock).mockReturnValue({
      userId: mockUserId,
      userName: mockUserName,
    })

    // Default mock for useMessaging
    ;(useMessaging as jest.Mock).mockReturnValue({
      users: [],
      activeGames: [],
      pendingChallenge: null,
      incomingChallenge: null,
      acceptedChallenge: null,
      challenge: jest.fn(),
      acceptChallenge: jest.fn(),
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
      updatePresence: jest.fn(),
      clearAcceptedChallenge: jest.fn(),
    })

    // Mock globalThis.location.href safely
    mockRedirectUrl = ""
    // We cannot easily mock globalThis.location.href in JSDOM if it's not configurable.
    // However, the 'game' component uses globalThis.location.href.
    // Let's try to mock it by redefining it on a new object and swapping globalThis.location if possible.
    // If not, we might need to mock GameUrl.create.
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // Since mocking location.href is hard, let's mock GameUrl.create to capture isCreator
  it("recipient of a normal challenge should NOT be first", async () => {
    const { GameUrl } = require("../utils/GameUrl")
    const createSpy = jest.spyOn(GameUrl, "create")

    const incomingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: mockOpponentId,
      challengerName: mockOpponentName,
      recipientId: mockUserId,
      ruleType: "nineball",
      tableId: "table-789",
    }

    const acceptChallengeMock = jest.fn().mockResolvedValue(undefined)
    ;(useMessaging as jest.Mock).mockReturnValue({
      users: [{ userId: mockOpponentId, userName: mockOpponentName }],
      activeGames: [],
      pendingChallenge: null,
      incomingChallenge,
      acceptedChallenge: null,
      challenge: jest.fn(),
      acceptChallenge: acceptChallengeMock,
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      clearAcceptedChallenge: jest.fn(),
    })

    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([]),
      "/api/match-results": () => mockFetchResponse([]),
    })

    // Mock location.href assignment to avoid JSDOM navigation error
    delete (globalThis as any).location
    globalThis.location = { href: "http://localhost/game" } as any

    render(<Game />)

    const acceptButton = screen.getByLabelText("Accept challenge")
    await act(async () => {
      acceptButton.click()
    })

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isCreator: false,
      })
    )
  })

  it("challenger of a normal challenge should be first when accepted", async () => {
    const { GameUrl } = require("../utils/GameUrl")
    const createSpy = jest.spyOn(GameUrl, "create")

    const acceptedChallenge = {
      messageType: "challenge",
      type: "accept",
      challengerId: mockUserId,
      challengerName: mockUserName,
      recipientId: mockOpponentId,
      ruleType: "nineball",
      tableId: "table-789",
    }

    ;(useMessaging as jest.Mock).mockReturnValue({
      users: [{ userId: mockOpponentId, userName: mockOpponentName }],
      activeGames: [],
      pendingChallenge: acceptedChallenge,
      incomingChallenge: null,
      acceptedChallenge,
      challenge: jest.fn(),
      acceptChallenge: jest.fn(),
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      clearAcceptedChallenge: jest.fn(),
    })

    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([]),
      "/api/match-results": () => mockFetchResponse([]),
    })

    delete (globalThis as any).location
    globalThis.location = { href: "http://localhost/game" } as any

    render(<Game />)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isCreator: true,
        })
      )
    })
  })

  it("challenger should be first even if accept payload has swapped challengerId", async () => {
    const { GameUrl } = require("../utils/GameUrl")
    const createSpy = jest.spyOn(GameUrl, "create")

    const acceptedChallenge = {
      messageType: "challenge",
      type: "accept",
      challengerId: mockOpponentId, // swapped by server
      challengerName: mockOpponentName,
      recipientId: mockUserId,
      ruleType: "nineball",
      tableId: "table-789",
    }

    ;(useMessaging as jest.Mock).mockReturnValue({
      users: [{ userId: mockOpponentId, userName: mockOpponentName }],
      activeGames: [],
      pendingChallenge: acceptedChallenge,
      incomingChallenge: null,
      acceptedChallenge,
      challenge: jest.fn(),
      acceptChallenge: jest.fn(),
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      clearAcceptedChallenge: jest.fn(),
    })

    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([]),
      "/api/match-results": () => mockFetchResponse([]),
    })

    delete (globalThis as any).location
    globalThis.location = { href: "http://localhost/game" } as any

    render(<Game />)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isCreator: true,
        })
      )
    })
  })

  it("recipient of a rematch challenge should be first if nextTurnId matches", async () => {
    const { GameUrl } = require("../utils/GameUrl")
    const createSpy = jest.spyOn(GameUrl, "create")

    const incomingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: mockOpponentId,
      challengerName: mockOpponentName,
      recipientId: mockUserId,
      ruleType: "nineball",
      tableId: "table-789",
      rematch: {
        lastScores: [
          { userId: mockUserId, score: 1 },
          { userId: mockOpponentId, score: 0 },
        ],
        isRematch: true,
        nextTurnId: mockUserId, // Me!
      },
    }

    const acceptChallengeMock = jest.fn().mockResolvedValue(undefined)
    ;(useMessaging as jest.Mock).mockReturnValue({
      users: [{ userId: mockOpponentId, userName: mockOpponentName }],
      activeGames: [],
      pendingChallenge: null,
      incomingChallenge,
      acceptedChallenge: null,
      challenge: jest.fn(),
      acceptChallenge: acceptChallengeMock,
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      clearAcceptedChallenge: jest.fn(),
    })

    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([]),
      "/api/match-results": () => mockFetchResponse([]),
    })

    delete (globalThis as any).location
    globalThis.location = { href: "http://localhost/game" } as any

    render(<Game />)

    const acceptButton = screen.getByLabelText("Accept challenge")
    await act(async () => {
      acceptButton.click()
    })

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        isCreator: true,
      })
    )
  })

  it("challenger of a rematch challenge should be first if nextTurnId matches", async () => {
    const { GameUrl } = require("../utils/GameUrl")
    const createSpy = jest.spyOn(GameUrl, "create")

    const acceptedChallenge = {
      messageType: "challenge",
      type: "accept",
      challengerId: mockUserId,
      challengerName: mockUserName,
      recipientId: mockOpponentId,
      ruleType: "nineball",
      tableId: "table-789",
      rematch: {
        lastScores: [
          { userId: mockUserId, score: 1 },
          { userId: mockOpponentId, score: 0 },
        ],
        isRematch: true,
        nextTurnId: mockUserId, // Me!
      },
    }

    ;(useMessaging as jest.Mock).mockReturnValue({
      users: [{ userId: mockOpponentId, userName: mockOpponentName }],
      activeGames: [],
      pendingChallenge: acceptedChallenge,
      incomingChallenge: null,
      acceptedChallenge,
      challenge: jest.fn(),
      acceptChallenge: jest.fn(),
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      clearAcceptedChallenge: jest.fn(),
    })

    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([]),
      "/api/match-results": () => mockFetchResponse([]),
    })

    delete (globalThis as any).location
    globalThis.location = { href: "http://localhost/game" } as any

    render(<Game />)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isCreator: true,
        })
      )
    })
  })

  it("challenger of a rematch challenge should NOT be first if nextTurnId does NOT match", async () => {
    const { GameUrl } = require("../utils/GameUrl")
    const createSpy = jest.spyOn(GameUrl, "create")

    const acceptedChallenge = {
      messageType: "challenge",
      type: "accept",
      challengerId: mockUserId,
      challengerName: mockUserName,
      recipientId: mockOpponentId,
      ruleType: "nineball",
      tableId: "table-789",
      rematch: {
        lastScores: [
          { userId: mockUserId, score: 1 },
          { userId: mockOpponentId, score: 0 },
        ],
        isRematch: true,
        nextTurnId: mockOpponentId, // Bob
      },
    }

    ;(useMessaging as jest.Mock).mockReturnValue({
      users: [{ userId: mockOpponentId, userName: mockOpponentName }],
      activeGames: [],
      pendingChallenge: acceptedChallenge,
      incomingChallenge: null,
      acceptedChallenge,
      challenge: jest.fn(),
      acceptChallenge: jest.fn(),
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      clearAcceptedChallenge: jest.fn(),
    })

    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([]),
      "/api/match-results": () => mockFetchResponse([]),
    })

    delete (globalThis as any).location
    globalThis.location = { href: "http://localhost/game" } as any

    render(<Game />)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isCreator: false,
        })
      )
    })
  })
})
