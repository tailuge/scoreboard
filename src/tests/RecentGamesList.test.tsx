import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { RecentGamesList } from "../components/RecentGamesList"
import { useUser } from "@/contexts/UserContext"
import { useLobbyTables } from "@/components/hooks/useLobbyTables"
import { useMatchHistory } from "@/components/hooks/useMatchHistory"
import { mockTable, mockMatchResult } from "../tests/mockData"

jest.mock("@/contexts/UserContext")
jest.mock("@/components/hooks/useLobbyTables")
jest.mock("@/components/hooks/useMatchHistory")

const mockedUseUser = useUser as jest.Mock
const mockedUseLobbyTables = useLobbyTables as jest.Mock
const mockedUseMatchHistory = useMatchHistory as jest.Mock

describe("RecentGamesList", () => {
  beforeEach(() => {
    mockedUseUser.mockReturnValue({
      userId: "user-1",
      userName: "User One",
    })
    mockedUseLobbyTables.mockReturnValue({
      tables: [],
      tableAction: jest.fn(),
    })
    mockedUseMatchHistory.mockReturnValue({
      results: [],
      isLoading: false,
    })
    globalThis.open = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("renders loading state when history is loading and no games", () => {
    mockedUseMatchHistory.mockReturnValue({
      results: [],
      isLoading: true,
    })

    render(<RecentGamesList />)

    expect(screen.getByText("Loading games...")).toBeInTheDocument()
  })

  it("renders empty state when no active or recent games", () => {
    render(<RecentGamesList />)

    expect(screen.getByText("No active or recent games.")).toBeInTheDocument()
  })

  it("renders live matches and match results", () => {
    const liveTable = {
      ...mockTable,
      players: [
        mockTable.players[0],
        { id: "user-2", name: "User Two" },
      ],
      completed: false,
    }
    mockedUseLobbyTables.mockReturnValue({
      tables: [liveTable],
      tableAction: jest.fn(),
    })
    mockedUseMatchHistory.mockReturnValue({
      results: [mockMatchResult],
      isLoading: false,
    })

    render(<RecentGamesList />)

    expect(screen.getByText("Recent Games")).toBeInTheDocument()
    expect(screen.getByText("User One")).toBeInTheDocument()
    expect(screen.getByText("User Two")).toBeInTheDocument()
    expect(screen.getByText("Player One")).toBeInTheDocument() // From mockMatchResult
  })

  it("triggers spectate action when Live button is clicked", () => {
    const tableAction = jest.fn()
    const liveTable = {
      ...mockTable,
      id: "live-1",
      players: [
        mockTable.players[0],
        { id: "user-2", name: "User Two" },
      ],
      completed: false,
    }
    mockedUseLobbyTables.mockReturnValue({
      tables: [liveTable],
      tableAction,
    })

    render(<RecentGamesList />)

    const liveButton = screen.getByText("Live")
    fireEvent.click(liveButton)

    expect(tableAction).toHaveBeenCalledWith("live-1", "spectate")
    expect(globalThis.open).toHaveBeenCalled()
  })
})
