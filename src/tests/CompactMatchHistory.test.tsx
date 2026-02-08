import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { CompactMatchHistory } from "../components/CompactMatchHistory"

// Mock fetch
const mockFetch = jest.fn()
globalThis.fetch = mockFetch

describe("CompactMatchHistory", () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("fetches and renders match results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResults),
    })

    render(<CompactMatchHistory gameType="snooker" />)

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument()
      expect(screen.getByText("Bob")).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/match-results?gameType=snooker&limit=3")
    )
  })

  it("shows empty state when no results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<CompactMatchHistory gameType="snooker" />)

    await waitFor(() => {
      expect(screen.getByText(/no matches/i)).toBeInTheDocument()
    })
  })
})
