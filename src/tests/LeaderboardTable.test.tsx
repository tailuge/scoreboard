import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LeaderboardTable from "../components/LeaderboardTable"
import { mockFetchResponse, createFetchMock } from "./testUtils"
import { mockLeaderboardData } from "./mockData"
import { navigateTo } from "@/utils/navigation"

jest.mock("@/utils/navigation", () => ({
  navigateTo: jest.fn(),
}))

describe("LeaderboardTable", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = createFetchMock({
      "/api/rank/": () => mockFetchResponse({ success: true }),
      "/api/rank?": () => mockFetchResponse(mockLeaderboardData),
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
    globalThis.fetch = createFetchMock({
      "/api/rank/": (url, options) =>
        options?.method === "PUT"
          ? Promise.resolve({ ok: false })
          : mockFetchResponse(mockLeaderboardData),
      "/api/rank?": () => mockFetchResponse(mockLeaderboardData),
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
    if (!playerRow) throw new Error("Player row not found")

    fireEvent.click(playerRow)

    expect(navigateTo).toHaveBeenCalledWith("/api/rank/1?ruletype=snooker")
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
    const player4Text = screen.queryByText("Player 4")
    if (!player4Text) throw new Error("Player 4 text not found")
    const player4Row = player4Text.closest("tr")
    if (!player4Row) throw new Error("Player 4 row not found")

    expect(player4Row.textContent).not.toContain("🏆")
    expect(player4Row.textContent).not.toContain("🥈")
    expect(player4Row.textContent).not.toContain("🥉")
  })
})
