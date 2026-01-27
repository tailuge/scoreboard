import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Lobby from "../pages/lobby"
import { useRouter } from "next/router"
import { useUser } from "@/contexts/UserContext"

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}))

// Mock useUser
jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

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

const TABLES_API_ENDPOINT = "/api/tables"

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

describe("Lobby Component Functional Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { username: "TestUser" },
      isReady: true,
      push: jest.fn(),
    })
    mockedUseUser.mockReturnValue({
      userId: "test-user-id",
      userName: "TestUser",
      setUserName: jest.fn(),
    })

    // Mock globalThis fetch
    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url === TABLES_API_ENDPOINT) {
        return Promise.resolve({
          json: () => Promise.resolve(mockTables),
          ok: true,
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
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
      expect(globalThis.fetch).toHaveBeenCalledWith(
        TABLES_API_ENDPOINT,
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
      expect(globalThis.fetch).toHaveBeenCalledWith(
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

describe("Lobby Redirection Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default search params mock (can be overridden in tests)
    ;(useRouter as jest.Mock).mockReturnValue({
      query: {
        username: "TestUser",
        action: "join",
        gameType: "nineball",
      },
      isReady: true,
      push: jest.fn(),
    })
    mockedUseUser.mockReturnValue({
      userId: "test-user-id",
      userName: "TestUser",
      setUserName: jest.fn(),
    })

    // Mock globalThis fetch
    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url === TABLES_API_ENDPOINT) {
        return Promise.resolve({
          json: () => Promise.resolve(mockTables),
          ok: true,
        })
      }
      if (url.includes("/join")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
    })
  })

  it("should attempt to join table and show PlayModal when redirecting with action=join", async () => {
    render(<Lobby />)

    // Check if fetch was called with PUT to join endpoint automatically
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/tables\/table-1\/join/),
        expect.objectContaining({
          method: "PUT",
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
    })
  })
})
