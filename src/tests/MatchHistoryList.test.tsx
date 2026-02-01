import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { MatchHistoryList } from "../components/MatchHistoryList"

describe("MatchHistoryList", () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("renders loading state initially", () => {
    ;(globalThis.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<MatchHistoryList />)
    expect(screen.getByText(/loading match history/i)).toBeInTheDocument()
  })

  it("renders empty state when no results", async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    render(<MatchHistoryList />)
    await waitFor(() => {
      expect(screen.getByText(/no matches recorded yet/i)).toBeInTheDocument()
    })
  })

  it("renders list of match results", async () => {
    const mockResults = [
      {
        id: "1",
        winner: "Alice",
        loser: "Bob",
        winnerScore: 100,
        loserScore: 85,
        gameType: "snooker",
        timestamp: Date.now(),
      },
    ]

    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    })

    render(<MatchHistoryList />)
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument()
    })
  })

  it("handles fetch error gracefully", async () => {
    ;(globalThis.fetch as jest.Mock).mockRejectedValue(
      new Error("Fetch failed")
    )
    render(<MatchHistoryList />)
    // Should still show loading or just not crash.
    // In our implementation it just logs and stays in loading/empty state.
    await waitFor(() => {
      expect(
        screen.queryByText(/loading match history/i)
      ).not.toBeInTheDocument()
    })
  })
})
