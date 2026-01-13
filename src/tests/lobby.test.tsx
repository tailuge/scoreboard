import React from "react"
import { render } from "@testing-library/react"
import { screen, fireEvent, waitFor } from "@testing-library/dom"
import Lobby from "../pages/lobby"
import { useSearchParams } from "next/navigation"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}))

// Mock markUsage
jest.mock("@/utils/usage", () => ({
  markUsage: jest.fn(),
}))

// Mock nchan
jest.mock("@/nchan/nchansub", () => ({
  NchanSub: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}))

jest.mock("@/nchan/nchanpub", () => ({
  NchanPub: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(5),
  })),
}))

const mockFetchActiveUsers = jest.fn()

// Mock useServerStatus hook to avoid network issues in tests
jest.mock("@/components/hooks/useServerStatus", () => ({
  useServerStatus: () => ({
    isOnline: true,
    serverStatus: "Server OK",
    isConnecting: false,
    activeUsers: 5,
    fetchActiveUsers: mockFetchActiveUsers,
  }),
}))

describe("Lobby Component Functional Tests", () => {
  const mockTables = [
    {
      id: "table-1",
      creator: { id: "creator-1", name: "Creator 1" },
      players: [{ id: "creator-1", name: "Creator 1" }],
      spectators: [],
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      isActive: true,
      ruleType: "nineball",
      completed: false,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "username" ? "TestUser" : null),
    })

    // Mock global fetch
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === "/api/tables") {
        return Promise.resolve({
          json: () => Promise.resolve(mockTables),
          ok: true,
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })
    })
  })

  it("should create a new game when 'Play Nineball' is clicked", async () => {
    render(<Lobby />)

    // Wait for initial tables to load
    const createButton = await screen.findByText(/Play Nineball/i)
    fireEvent.click(createButton)

    // Check if fetch was called with POST to /api/tables
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tables",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"ruleType":"nineball"'),
        })
      )
    })
  })

  it("should join a game when 'Join' is clicked on a table", async () => {
    render(<Lobby />)

    // Wait for table to appear (Check for creator name or Join button)
    const joinButton = await screen.findByLabelText("Join Table")
    fireEvent.click(joinButton)

    // Check if fetch was called with PUT to join endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/tables\/table-1\/join/),
        expect.objectContaining({
          method: "PUT",
        })
      )
    })

    // Verify that the PlayModal appears
    await waitFor(() => {
      expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
    })
  })
})
