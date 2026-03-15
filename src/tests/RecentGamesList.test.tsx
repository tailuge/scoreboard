import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { RecentGamesList } from "../components/RecentGamesList"
import { useUser } from "@/contexts/UserContext"
import { useMatchHistory } from "@/components/hooks/useMatchHistory"

jest.mock("@/contexts/UserContext")
jest.mock("@/components/hooks/useMatchHistory")
jest.mock("@/contexts/MessagingContext", () => ({
  useMessaging: jest.fn(),
}))

const useUserSpy = useUser as jest.Mock
const useMatchHistorySpy = useMatchHistory as jest.Mock
const useMessagingSpy = jest.requireMock("@/contexts/MessagingContext")
  .useMessaging as jest.Mock

describe("RecentGamesList Component", () => {
  const dummyUser = {
    userId: "u-999",
    userName: "Unique Player",
  }

  const dummyLiveGame = {
    tableId: "table-unique-123",
    players: [
      { id: "u-999", name: "Unique Player" },
      { id: "u-888", name: "Other Player" },
    ],
    ruleType: "snooker",
  }

  const dummyHistory = {
    id: "match-unique-456",
    winner: "Winner Name",
    loser: "Loser Name",
    winnerScore: 147,
    loserScore: 0,
    ruleType: "snooker",
    timestamp: Date.now(),
  }

  const configureMocks = (config: any = {}) => {
    useMatchHistorySpy.mockReturnValue({
      results: config.results || [],
      isLoading: config.loading === undefined ? false : config.loading,
    })
    useMessagingSpy.mockReturnValue({
      users: [],
      activeGames: config.liveGames || [],
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
  }

  beforeEach(() => {
    useUserSpy.mockReturnValue(dummyUser)
    configureMocks()
    globalThis.open = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("displays loading text when fetching history", () => {
    configureMocks({ loading: true })
    render(<RecentGamesList />)
    expect(screen.getByText("Loading games...")).toBeInTheDocument()
  })

  it("displays empty message when no matches exist", () => {
    render(<RecentGamesList />)
    expect(screen.getByText("No active or recent games.")).toBeInTheDocument()
  })

  it("renders both live and past match entries", () => {
    configureMocks({
      liveGames: [dummyLiveGame],
      results: [dummyHistory],
    })
    render(<RecentGamesList />)
    expect(screen.getByText("Recent Games")).toBeInTheDocument()
    expect(screen.getByText("Unique Player")).toBeInTheDocument()
    expect(screen.getByText("Other Player")).toBeInTheDocument()
    expect(screen.getByText("Winner Name")).toBeInTheDocument()
  })

  it("handles spectating interaction for active tables", () => {
    configureMocks({
      liveGames: [dummyLiveGame],
    })
    render(<RecentGamesList />)
    fireEvent.click(screen.getByText("Live"))
    expect(globalThis.open).toHaveBeenCalled()
  })
})
