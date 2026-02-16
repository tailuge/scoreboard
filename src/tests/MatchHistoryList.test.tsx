import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { MatchHistoryList } from "../components/MatchHistoryList"
import { useUser } from "@/contexts/UserContext"

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

describe("MatchHistoryList", () => {
  beforeEach(() => {
    mockedUseUser.mockReturnValue({
      userId: "test-user-id",
      userName: "TestUser",
    })
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("renders loading state initially", async () => {
    ;(globalThis.fetch as jest.Mock).mockReturnValue(new Promise(() => {}))
    render(<MatchHistoryList />)
    expect(screen.getByText(/loading match history/i)).toBeInTheDocument()
    await waitFor(() => {}, { timeout: 100 })
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
        ruleType: "snooker",
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
    await waitFor(() => {
      expect(
        screen.queryByText(/loading match history/i)
      ).not.toBeInTheDocument()
    })
  })
})
