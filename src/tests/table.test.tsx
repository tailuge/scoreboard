import { render, screen, fireEvent } from "@testing-library/react"
import { TableItem } from "@/components/table"
import "@testing-library/jest-dom"
import { Table } from "@/types/table"
import { useUser } from "@/contexts/UserContext"

// Mock the useUser hook
jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

describe("TableItem", () => {
  const mockOnJoin = jest.fn()
  const mockOnSpectate = jest.fn()

  const baseTable: Table = {
    id: "table-1",
    creator: { id: "user-1", name: "User 1" },
    players: [{ id: "user-1", name: "User 1" }],
    spectators: [],
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    isActive: true,
    ruleType: "nineball",
    completed: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseUser.mockReturnValue({
      userId: "user-2",
      userName: "User 2",
      setUserName: jest.fn(),
    })
  })

  it("renders a waiting table correctly", () => {
    render(
      <TableItem
        table={baseTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )

    expect(screen.getByText("nineball")).toBeInTheDocument()
    expect(
      screen.getByText("User 1 - waiting for opponent")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Join Table")).toBeInTheDocument()
  })

  it("renders an occupied table correctly and allows spectating", () => {
    mockedUseUser.mockReturnValue({
      userId: "user-3",
      userName: "User 3",
      setUserName: jest.fn(),
    })
    const occupiedTable: Table = {
      ...baseTable,
      players: [
        { id: "user-1", name: "User 1" },
        { id: "user-2", name: "User 2" },
      ],
      spectators: [{ id: "spec-1", name: "Spec 1" }],
    }

    render(
      <TableItem
        table={occupiedTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )

    expect(screen.getByText("User 1 vs User 2")).toBeInTheDocument()
    const spectateButton = screen.getByLabelText("Spectate Table")
    expect(spectateButton).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument() // Spectator count

    fireEvent.click(spectateButton)
    expect(mockOnSpectate).toHaveBeenCalledWith("table-1")

    // Should show IFrameOverlay
    expect(screen.getByTitle("Spectator Window")).toBeInTheDocument()

    // Test closing spectate
    fireEvent.click(screen.getByText("Close"))
    expect(screen.queryByTitle("Spectator Window")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Spectate Table")).toBeInTheDocument()
  })

  it("renders a completed table with correct class", () => {
    mockedUseUser.mockReturnValue({
      userId: "user-3",
      userName: "User 3",
      setUserName: jest.fn(),
    })
    const completedTable: Table = {
      ...baseTable,
      players: [
        { id: "user-1", name: "User 1" },
        { id: "user-2", name: "User 2" },
      ],
      completed: true,
    }

    const { container } = render(
      <TableItem
        table={completedTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )

    // Check for table-completed class
    const tableCard = container.querySelector(".table-card")
    expect(tableCard).toHaveClass("table-completed")
  })

  it("renders threecushion table without pockets", () => {
    const threecushionTable: Table = {
      ...baseTable,
      ruleType: "threecushion",
    }

    const { container } = render(
      <TableItem
        table={threecushionTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )

    expect(container.querySelector(".table-pocket")).not.toBeInTheDocument()
  })

  it("identifies creator and adds table-card-creator class", () => {
    mockedUseUser.mockReturnValue({
      userId: "user-1",
      userName: "User 1",
      setUserName: jest.fn(),
    })
    const { container } = render(
      <TableItem
        table={baseTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )

    const tableCard = container.querySelector(".table-card")
    expect(tableCard).toHaveClass("table-card-creator")
  })

  it("handles re-renders for memoization", () => {
    const { rerender } = render(
      <TableItem
        table={baseTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )
    expect(screen.getByText("nineball")).toBeInTheDocument()

    // Same props
    rerender(
      <TableItem
        table={baseTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )
    expect(screen.getByText("nineball")).toBeInTheDocument()

    // Updated table
    const updatedTable = { ...baseTable, lastUsedAt: baseTable.lastUsedAt + 1 }
    rerender(
      <TableItem
        table={updatedTable}
        onJoin={mockOnJoin}
        onSpectate={mockOnSpectate}
      />
    )
    expect(screen.getByText("nineball")).toBeInTheDocument()

    // Different functions
    rerender(
      <TableItem table={updatedTable} onJoin={() => {}} onSpectate={() => {}} />
    )
    expect(screen.getByText("nineball")).toBeInTheDocument()
  })
})
