import React from "react"
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import Game from "../pages/game"
import { setupUserMock, createFetchMock, mockFetchResponse } from "./testUtils"
import { useMessaging } from "@/contexts/MessagingContext"
import { GameUrl } from "@/utils/GameUrl"
import { navigateTo } from "@/utils/navigation"

jest.mock("@/contexts/UserContext", () => ({ useUser: jest.fn() }))
jest.mock("@/contexts/MessagingContext", () => ({
  useMessaging: jest.fn(),
}))
jest.mock("@/utils/navigation", () => ({
  navigateTo: jest.fn(),
}))

// Mock components that trigger async fetches to avoid 'act' warnings and side effects
jest.mock("@/components/HighscoreGrid", () => ({
  HighscoreGrid: () => <div data-testid="highscore-grid" />,
}))
jest.mock("@/components/MatchHistoryList", () => ({
  MatchHistoryList: () => <div data-testid="match-history-list" />,
}))

describe("Game Page", () => {
  let mockMessaging: any

  beforeEach(() => {
    jest.clearAllMocks()
    setupUserMock("me-id", "Me")

    mockMessaging = {
      users: [],
      activeGames: [],
      pendingChallenge: null,
      incomingChallenge: null,
      acceptedChallenge: null,
      chats: {},
      unreadUsers: [],
      challenge: jest.fn().mockResolvedValue("table-123"),
      acceptChallenge: jest.fn().mockResolvedValue(undefined),
      declineChallenge: jest.fn().mockResolvedValue(undefined),
      cancelChallenge: jest.fn().mockResolvedValue(undefined),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      clearAcceptedChallenge: jest.fn(),
      sendChat: jest.fn().mockResolvedValue(undefined),
      markChatAsRead: jest.fn(),
    }
    ;(useMessaging as jest.Mock).mockReturnValue(mockMessaging)

    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([]),
      "/api/match-results": () => mockFetchResponse([]),
    })

    // Mock window.location minimally
    delete (globalThis as any).location
    ;(globalThis as any).location = {
      href: "http://localhost/game",
      toString: () => "http://localhost/game",
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    }
  })

  it("renders the game selection page and online users", async () => {
    mockMessaging.users = [
      { userId: "me-id", userName: "Me" },
      { userId: "other-id", userName: "Other" },
    ]

    render(<Game />)

    expect(await screen.findByText(/Other/)).toBeInTheDocument()
    expect(screen.getByLabelText("2 users online")).toBeInTheDocument()
  })

  it("handles incoming challenge and acceptance", async () => {
    mockMessaging.incomingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: "other-id",
      challengerName: "Other",
      recipientId: "me-id",
      ruleType: "nineball",
      tableId: "table-123",
    }

    render(<Game />)

    expect(await screen.findByText(/Other wants to play/)).toBeInTheDocument()

    const acceptBtn = screen.getByRole("button", { name: "Accept challenge" })
    await act(async () => {
      fireEvent.click(acceptBtn)
    })

    expect(mockMessaging.acceptChallenge).toHaveBeenCalledWith(
      "other-id",
      "nineball",
      "table-123"
    )
    expect(navigateTo).toHaveBeenCalled()
  })

  it("handles declining an incoming challenge", async () => {
    mockMessaging.incomingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: "other-id",
      challengerName: "Other",
      recipientId: "me-id",
      ruleType: "snooker",
      tableId: "table-123",
    }

    render(<Game />)

    const declineBtn = await screen.findByRole("button", {
      name: "Decline challenge",
    })
    await act(async () => {
      fireEvent.click(declineBtn)
    })

    expect(mockMessaging.declineChallenge).toHaveBeenCalledWith(
      "other-id",
      "snooker"
    )
  })

  it("handles cancelling a pending challenge", async () => {
    mockMessaging.pendingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: "me-id",
      challengerName: "Me",
      recipientId: "other-id",
      ruleType: "threecushion",
      tableId: "table-123",
    }
    mockMessaging.users = [{ userId: "other-id", userName: "Other" }]

    render(<Game />)

    expect(
      await screen.findByText(/Waiting for Other to accept/)
    ).toBeInTheDocument()

    const cancelBtn = screen.getByRole("button", { name: "Cancel challenge" })
    await act(async () => {
      fireEvent.click(cancelBtn)
    })

    expect(mockMessaging.cancelChallenge).toHaveBeenCalledWith(
      "other-id",
      "threecushion"
    )
  })

  it("initiates a challenge from the user list", async () => {
    mockMessaging.users = [
      { userId: "me-id", userName: "Me" },
      { userId: "other-id", userName: "Other" },
    ]

    render(<Game />)

    const challengeBtn = await screen.findByRole("button", {
      name: "Challenge Other",
    })
    fireEvent.click(challengeBtn)

    expect(screen.getByText("Challenge Other")).toBeInTheDocument()

    const snookerBtn = screen.getByRole("button", { name: "Play snooker" })
    await act(async () => {
      fireEvent.click(snookerBtn)
    })

    expect(mockMessaging.challenge).toHaveBeenCalledWith("other-id", "snooker")
  })

  it("handles auto-rematch from URL parameter", async () => {
    const rematchData = {
      opponentId: "other-id",
      opponentName: "Other",
      ruleType: "nineball",
      lastScores: [
        { userId: "me-id", score: 1 },
        { userId: "other-id", score: 0 },
      ],
      nextTurnId: "other-id",
    }
    const parseSpy = jest.spyOn(GameUrl, "parseRematch").mockReturnValue(rematchData)

    mockMessaging.users = [{ userId: "other-id", userName: "Other" }]

    render(<Game />)

    await waitFor(() => {
      expect(mockMessaging.challenge).toHaveBeenCalledWith(
        "other-id",
        "nineball",
        expect.objectContaining({ isRematch: true })
      )
    })
    parseSpy.mockRestore()
  })

  it("auto-accepts mutual rematch", async () => {
    const rematchData = {
      opponentId: "other-id",
      opponentName: "Other",
      ruleType: "nineball",
      lastScores: [],
      nextTurnId: "me-id",
    }
    const parseSpy = jest.spyOn(GameUrl, "parseRematch").mockReturnValue(rematchData)

    mockMessaging.incomingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: "other-id",
      challengerName: "Other",
      recipientId: "me-id",
      ruleType: "nineball",
      tableId: "table-mutual",
      rematch: { lastScores: [], isRematch: true, nextTurnId: "me-id" },
    }

    render(<Game />)

    await waitFor(() => {
      expect(mockMessaging.acceptChallenge).toHaveBeenCalled()
    })
    parseSpy.mockRestore()
  })

  it("handles accepted challenge and redirects", async () => {
    mockMessaging.acceptedChallenge = {
      messageType: "challenge",
      type: "accept",
      challengerId: "me-id",
      recipientId: "other-id",
      ruleType: "nineball",
      tableId: "table-accepted",
    }
    // Set pending challenge so the effect matches it
    mockMessaging.pendingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: "me-id",
      recipientId: "other-id",
      ruleType: "nineball",
      tableId: "table-accepted",
    }

    render(<Game />)

    await waitFor(() => {
      expect(navigateTo).toHaveBeenCalled()
      expect(mockMessaging.clearAcceptedChallenge).toHaveBeenCalled()
    })
  })

  it("handles chat selection and marking as read", async () => {
    mockMessaging.users = [
      { userId: "me-id", userName: "Me" },
      { userId: "other-id", userName: "Other" }
    ]
    mockMessaging.unreadUsers = ["other-id"]

    render(<Game />)

    const chatBtn = await screen.findByRole("button", {
      name: "Chat with Other",
    })
    fireEvent.click(chatBtn)

    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument()
    expect(mockMessaging.markChatAsRead).toHaveBeenCalledWith("other-id")
  })

  it("handles challenge error", async () => {
    mockMessaging.users = [
      { userId: "me-id", userName: "Me" },
      { userId: "other-id", userName: "Other" }
    ]
    mockMessaging.challenge.mockRejectedValueOnce(new Error("Failed"))

    render(<Game />)

    fireEvent.click(
      await screen.findByRole("button", { name: "Challenge Other" })
    )
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Play snooker" }))
    })

    await waitFor(() => {
      expect(
        screen.getByText("Failed to send challenge. Please try again.")
      ).toBeInTheDocument()
    })
  })

  it("handles accept challenge with missing table information", async () => {
    mockMessaging.incomingChallenge = {
      messageType: "challenge",
      type: "offer",
      challengerId: "other-id",
      challengerName: "Other",
      recipientId: "me-id",
      ruleType: "nineball",
      // tableId missing
    }

    render(<Game />)

    const acceptBtn = await screen.findByRole("button", { name: "Accept challenge" })
    fireEvent.click(acceptBtn)

    expect(await screen.findByText("Challenge is missing table information.")).toBeInTheDocument()
  })
})
