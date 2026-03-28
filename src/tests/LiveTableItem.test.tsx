import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { LiveTableItem } from "../components/LiveTableItem"
import { useUser } from "../contexts/UserContext"
import type { ActiveGame } from "@tailuge/messaging"

jest.mock("../contexts/UserContext")

describe("LiveTableItem", () => {
  const mockOnSpectate = jest.fn()
  const mockGame: ActiveGame = {
    tableId: "test-table",
    ruleType: "nineball",
    players: [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUser as jest.Mock).mockReturnValue({
      userId: "me",
      userName: "MeUser",
    })

    // Minimal mock to avoid "Not implemented: navigation" error
    // We don't delete location, just mock the setter behavior if possible or ignore the error
    jest.spyOn(console, "error").mockImplementation((msg) => {
      if (typeof msg === "string" && msg.includes("Not implemented: navigation"))
        return
      // console.log('CAUGHT ERROR:', msg)
    })
  })

  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  it("renders names of players from the game", () => {
    render(<LiveTableItem game={mockGame} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("calls onSpectate when clicked", () => {
    render(<LiveTableItem game={mockGame} onSpectate={mockOnSpectate} />)

    const item = screen.getByText("Alice").closest("button")!
    fireEvent.click(item)

    expect(mockOnSpectate).toHaveBeenCalledWith("test-table")
    // We skip testing window.location.href assignment as per requirements
  })

  it("defaults to nineball ruleType if not provided in game", () => {
    const gameWithoutRule = { ...mockGame, ruleType: undefined }
    render(<LiveTableItem game={gameWithoutRule} />)

    // MatchResultCard renders an icon with the ball number.
    // For nineball, it uses (timestamp % 15) + 1. Timestamp 0 => 1.
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("handles missing player names", () => {
    const gameWithMissingNames: ActiveGame = {
      ...mockGame,
      players: [
        { id: "1" } as any,
        { id: "2" } as any
      ]
    }
    render(<LiveTableItem game={gameWithMissingNames} />)
    expect(screen.getByText("Player 1")).toBeInTheDocument()
    expect(screen.getByText("Player 2")).toBeInTheDocument()
  })
})
