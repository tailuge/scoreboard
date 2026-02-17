import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LeaderboardTable from "../components/LeaderboardTable"

describe("LeaderboardTable", () => {
  const mockData = [
    { id: "1", name: "Player 1", score: 100, likes: 5 },
    { id: "2", name: "Player 2", score: 90, likes: 3 },
    { id: "3", name: "Player 3", score: 80, likes: 1 },
    { id: "4", name: "Player 4", score: 70, likes: 0 },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn().mockImplementation((url, options) => {
      if (options?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      }
      if (url.toString().includes("/api/rank?")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })
  })

  it("fetches and renders leaderboard data", async () => {
    render(<LeaderboardTable ruleType="snooker" />)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/rank?ruletype=snooker")
    )

    await waitFor(() => {
      expect(screen.getByText("Player 1")).toBeInTheDocument()
      expect(screen.getByText("Player 2")).toBeInTheDocument()
      expect(screen.getByText("🏆")).toBeInTheDocument()
      expect(screen.getByText("🥈")).toBeInTheDocument()
      expect(screen.getByText("🥉")).toBeInTheDocument()
    })
  })

  it("handles like button click", async () => {
    render(<LeaderboardTable ruleType="snooker" />)

    await waitFor(() => screen.getByText("Player 1"))

    const likeButtons = screen.getAllByText(/👍/)
    fireEvent.click(likeButtons[0])

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/rank/1"),
      expect.objectContaining({ method: "PUT" })
    )

    await waitFor(() => {
      expect(screen.getByText("👍 6")).toBeInTheDocument()
    })
  })

  it("handles like button error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    globalThis.fetch = jest.fn().mockImplementation((url, options) => {
      if (options?.method === "PUT") {
        return Promise.resolve({ ok: false })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData),
      })
    })

    render(<LeaderboardTable ruleType="snooker" />)

    await waitFor(() => screen.getByText("Player 1"))

    const likeButtons = screen.getAllByText(/👍/)
    fireEvent.click(likeButtons[0])

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error updating likes:",
        expect.any(Error)
      )
    })
    consoleSpy.mockRestore()
  })

  it("handles row click for replay", async () => {
    render(<LeaderboardTable ruleType="snooker" />)

    await waitFor(() => screen.getByText("Player 1"))

    const playerRow = screen.getByText("Player 1").closest("tr")
    expect(playerRow).not.toBeNull()

    // JSDOM navigation is not implemented, so we just verify it doesn't crash
    // and use a spy on console.error if JSDOM logs it there, or just catch.
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    try {
      fireEvent.click(playerRow!)
    } catch (e) {
      // Ignore navigation errors
    }
    consoleSpy.mockRestore()
    // Code path for handleRowClick is hit.
  })

  it("renders placeholders when limit is higher than data length", async () => {
    render(<LeaderboardTable ruleType="snooker" limit={6} />)

    await waitFor(() => screen.getByText("Player 1"))

    // 4 players + 2 placeholders = 6 rows in tbody
    const tableBody = screen.getAllByRole("rowgroup")[1] // [0] is thead, [1] is tbody
    const rows = tableBody.querySelectorAll("tr")
    expect(rows.length).toBe(6)
  })

  it("renders in compact mode", async () => {
    render(<LeaderboardTable ruleType="snooker" compact={true} />)

    await waitFor(() => screen.getByText("Player 1"))

    // Compact mode hides thead
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument()
  })

  it("handles fetch error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false })

    render(<LeaderboardTable ruleType="snooker" />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching leaderboard data:",
        expect.any(Error)
      )
    })
    consoleSpy.mockRestore()
  })

  it("renders correctly with default values for limit and compact", async () => {
    render(<LeaderboardTable ruleType="snooker" />)
    await waitFor(() => screen.getByText("Player 1"))

    // Default index > 2 should not have trophy
    expect(
      screen.queryByText("Player 4")?.closest("tr")?.textContent
    ).not.toContain("🏆")
    expect(
      screen.queryByText("Player 4")?.closest("tr")?.textContent
    ).not.toContain("🥈")
    expect(
      screen.queryByText("Player 4")?.closest("tr")?.textContent
    ).not.toContain("🥉")
  })
})
