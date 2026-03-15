import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import Game from "../pages/game"
import { setupUserMock, createFetchMock, mockFetchResponse } from "./testUtils"

jest.mock("@/contexts/UserContext", () => ({ useUser: jest.fn() }))
jest.mock("@/contexts/MessagingContext", () => ({
  useMessaging: jest.fn(),
}))

describe("Game Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUserMock()
    const { useMessaging } = jest.requireMock(
      "@/contexts/MessagingContext"
    ) as {
      useMessaging: jest.Mock
    }
    useMessaging.mockReturnValue({
      users: [],
      activeGames: [],
      pendingChallenge: null,
      incomingChallenge: null,
      challenge: jest.fn(),
      acceptChallenge: jest.fn(),
      declineChallenge: jest.fn(),
      cancelChallenge: jest.fn(),
    })
    globalThis.fetch = createFetchMock({
      "/api/rank": () =>
        mockFetchResponse([
          { id: "1", name: "TopPlayer", score: 999, likes: 0 },
        ]),
      "/api/match-results": () =>
        mockFetchResponse([
          {
            id: "1",
            winner: "Alice",
            winnerScore: 10,
            ruleType: "nineball",
            timestamp: Date.now(),
          },
        ]),
    })
  })

  it("renders the game selection page with 3 buttons", async () => {
    render(<Game />)

    expect(
      screen.getByRole("link", { name: /^Play Snooker$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /^Play Nine Ball$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /^Play Three Cushion$/i })
    ).toBeInTheDocument()

    expect(screen.getAllByText("Practice")).toHaveLength(3)
    expect(screen.getAllByText("Online")).toHaveLength(3)

    expect(
      screen.getByAltText(
        "Play classic Snooker billiards online with 22 balls on a full-size table"
      )
    ).toBeInTheDocument()
    expect(
      screen.getByAltText(
        "Play 9-Ball pool online - fast-paced pocket billiards game"
      )
    ).toBeInTheDocument()
    expect(
      screen.getByAltText(
        "Play Three Cushion carom billiards online - no pockets, hit three rails"
      )
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText("TopPlayer")).toHaveLength(3)
    })
  })
})
