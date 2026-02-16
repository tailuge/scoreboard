import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { RecentGamesList } from "../components/RecentGamesList"
import { useUser } from "@/contexts/UserContext"
import { useLobbyTables } from "@/components/hooks/useLobbyTables"
import { useMatchHistory } from "@/components/hooks/useMatchHistory"

jest.mock("@/contexts/UserContext")
jest.mock("@/components/hooks/useLobbyTables")
jest.mock("@/components/hooks/useMatchHistory")

const useUserSpy = useUser as jest.Mock
const useLobbyTablesSpy = useLobbyTables as jest.Mock
const useMatchHistorySpy = useMatchHistory as jest.Mock

describe("RecentGamesList Component", () => {
  const dummyUser = {
    userId: "u-999",
    userName: "Unique Player",
  }

  const dummyLiveTable = {
    id: "table-unique-123",
    creator: { id: "u-999", name: "Unique Player" },
    players: [
      { id: "u-999", name: "Unique Player" },
      { id: "u-888", name: "Other Player" },
    ],
    spectators: [],
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    isActive: true,
    ruleType: "snooker",
    completed: false,
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
    useLobbyTablesSpy.mockReturnValue({
      tables: config.tables || [],
      tableAction: config.tableAction || jest.fn(),
    })
    useMatchHistorySpy.mockReturnValue({
      results: config.results || [],
      isLoading: config.loading === undefined ? false : config.loading,
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
      tables: [dummyLiveTable],
      results: [dummyHistory],
    })
    render(<RecentGamesList />)
    expect(screen.getByText("Recent Games")).toBeInTheDocument()
    expect(screen.getByText("Unique Player")).toBeInTheDocument()
    expect(screen.getByText("Other Player")).toBeInTheDocument()
    expect(screen.getByText("Winner Name")).toBeInTheDocument()
  })

  it("handles spectating interaction for active tables", () => {
    const actionMock = jest.fn()
    configureMocks({
      tables: [dummyLiveTable],
      tableAction: actionMock,
    })
    render(<RecentGamesList />)
    fireEvent.click(screen.getByText("Live"))
    expect(actionMock).toHaveBeenCalledWith("table-unique-123", "spectate")
    expect(globalThis.open).toHaveBeenCalled()
  })
})
