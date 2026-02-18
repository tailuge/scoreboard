import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import Game from "../pages/game"
import { LobbyProvider } from "@/contexts/LobbyContext"
import { setupUserMock, setupLobbyMocks, createFetchMock, mockFetchResponse } from "./testUtils"

jest.mock("../nchan/nchansub", () => ({
  NchanSub: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}))

jest.mock("../nchan/nchanpub", () => ({
  NchanPub: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(0),
    post: jest.fn().mockResolvedValue(undefined),
    publishLobby: jest.fn().mockResolvedValue(undefined),
    publishPresence: jest.fn().mockResolvedValue(undefined),
  })),
}))

// Mock usePresenceMessages
jest.mock("@/contexts/LobbyContext", () => ({
  LobbyProvider: jest.fn(({ children }) => <>{children}</>),
  useLobbyContext: jest.fn(),
  useLobbyMessages: jest.fn(),
  usePresenceMessages: jest.fn(),
}))

jest.mock("@/contexts/UserContext", () => ({ useUser: jest.fn() }))

// Mock usePresenceList hook
jest.mock("@/components/hooks/usePresenceList", () => ({
  usePresenceList: jest.fn(() => ({
    users: [],
    count: 0,
  })),
}))

// Mock useLobbyTables hook
jest.mock("@/components/hooks/useLobbyTables", () => ({
  useLobbyTables: jest.fn(() => ({
    tables: [],
    tableAction: jest.fn(),
  })),
}))

describe("Game Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupUserMock()
    setupLobbyMocks()
    globalThis.fetch = createFetchMock({
      "/api/rank": () => mockFetchResponse([{ id: "1", name: "TopPlayer", score: 999, likes: 0 }]),
      "/api/match-results": () => mockFetchResponse([{
        id: "1",
        winner: "Alice",
        winnerScore: 10,
        ruleType: "nineball",
        timestamp: Date.now(),
      }]),
    })
  })

  it("renders the game selection page with 3 buttons", async () => {
    render(
      <LobbyProvider>
        <Game />
      </LobbyProvider>
    )

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
