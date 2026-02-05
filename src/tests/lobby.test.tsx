import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Lobby from "../pages/lobby"
import { useRouter } from "next/router"
import { useUser } from "@/contexts/UserContext"
import { LobbyProvider } from "@/contexts/LobbyContext"

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
      ; (useRouter as jest.Mock).mockReturnValue({
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
      if (
        url.includes("/join") ||
        url.includes("/spectate") ||
        url.includes("/find-or-create")
      ) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTables[0]),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
    })
  })

  it("should show seeking UI when action=join is triggered and no pending table found", async () => {
    // Override useRouter for this test
    ; (useRouter as jest.Mock).mockReturnValue({
      query: { action: "join", gameType: "nineball" },
      isReady: true,
      push: jest.fn(),
    })

    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    // Verify seeking message appears
    const seekingMessage = await screen.findByText(/Seeking nineball Match/i)
    expect(seekingMessage).toBeInTheDocument()
    expect(screen.getByText(/Cancel Search/i)).toBeInTheDocument()

    // Test Cancel Search
    const cancelButton = screen.getByText(/Cancel Search/i)
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText(/Seeking nineball Match/i)).not.toBeInTheDocument()
    })
  })

  it("should join a game when 'Join' is clicked on a table", async () => {
    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

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

    // Test closing the modal
    const cancelButton = screen.getByText(/Cancel/i)
    fireEvent.click(cancelButton)
    await waitFor(() => {
      expect(screen.queryByText("Opponent Ready")).not.toBeInTheDocument()
    })
  })

  it("should call spectate when spectate button is clicked", async () => {
    // Add a full table to mockTables
    const fullTable = {
      ...mockTables[0],
      id: "table-full",
      players: [
        { id: "creator-1", name: "Creator 1" },
        { id: "player-2", name: "Player 2" },
      ],
    }
      ; (globalThis.fetch as jest.Mock).mockImplementation((url) => {
        if (url === TABLES_API_ENDPOINT) {
          return Promise.resolve({
            json: () => Promise.resolve([fullTable]),
            ok: true,
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })
      })

    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    // Wait for tables to load
    const spectateButtons = await screen.findAllByLabelText(/Spectate Table/i)
    fireEvent.click(spectateButtons[0])

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/tables\/table-full\/spectate/),
        expect.objectContaining({
          method: "PUT",
        })
      )
    })
  })
})

describe("Lobby Redirection Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()

      // Default search params mock (can be overridden in tests)
      ; (useRouter as jest.Mock).mockReturnValue({
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
      if (url.includes("/join") || url.includes("/find-or-create")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              ...mockTables[0],
              players: [
                { id: "creator-1", name: "Creator 1" },
                { id: "test-user-id", name: "TestUser" },
              ],
            }),
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
    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    // Check if fetch was called with POST to find-or-create endpoint automatically
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/tables\/find-or-create/),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"gameType":"nineball"'),
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
    })
  })
})
