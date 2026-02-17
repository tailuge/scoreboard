import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
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
    post: jest.fn().mockResolvedValue(undefined),
    publishLobby: jest.fn().mockResolvedValue(undefined),
    publishPresence: jest.fn().mockResolvedValue(undefined),
  })),
}))

// Mock usePresenceMessages
jest.mock("@/contexts/LobbyContext", () => ({
  LobbyProvider: ({ children }: { children: React.ReactNode }) => children,
  useLobbyContext: jest.fn(),
  useLobbyMessages: jest.fn(() => ({ lastMessage: null })),
  usePresenceMessages: jest.fn(() => ({ lastMessage: null })),
}))

// Mock usePresenceList hook
jest.mock("@/components/hooks/usePresenceList", () => ({
  usePresenceList: jest.fn(() => ({
    users: [],
    count: 0,
  })),
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
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { action: "join", ruletype: "nineball" },
      isReady: true,
      push: jest.fn(),
    })

    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    // Verify seeking message appears
    const seekingMessage = await screen.findByText(
      /Finding a nineball opponent/i
    )
    expect(seekingMessage).toBeInTheDocument()
    expect(screen.getByText(/Cancel Search/i)).toBeInTheDocument()

    // Test Cancel Search
    const cancelButton = screen.getByText(/Cancel Search/i)
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(
        screen.queryByText(/Finding a nineball opponent/i)
      ).not.toBeInTheDocument()
    })
  })

  it("should hide table actions when rendering the lobby", async () => {
    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    await waitFor(() => {
      expect(screen.queryByLabelText("Join Table")).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Spectate Table/i)).not.toBeInTheDocument()
    })
  })

  it("should keep table data fetching active even when tables are hidden", async () => {
    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(TABLES_API_ENDPOINT)
    })
  })
})

describe("Lobby Timeout and Cleanup Tests", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      query: {},
      isReady: true,
      push: jest.fn(),
    })
    mockedUseUser.mockReturnValue({
      userId: "test-user-id",
      userName: "TestUser",
      setUserName: jest.fn(),
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("should timeout after 60 seconds of seeking", async () => {
    const routerPush = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { action: "join", ruletype: "snooker" },
      isReady: true,
      push: routerPush,
    })

    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/find-or-create")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              id: "table-seeking-123",
              creator: { id: "test-user-id", name: "TestUser" },
              players: [{ id: "test-user-id", name: "TestUser" }],
              ruleType: "snooker",
              completed: false,
            }),
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

    await screen.findByText(/Finding a snooker opponent/i)

    act(() => {
      jest.advanceTimersByTime(60000)
    })

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/tables\/table-seeking-123\/delete/),
        expect.any(Object)
      )
      expect(routerPush).toHaveBeenCalledWith("/game")
    })
  })

  it("should call delete API on unmount if seeking", async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { action: "join", ruletype: "snooker" },
      isReady: true,
      push: jest.fn(),
    })

    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/find-or-create")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              id: "table-seeking-unmount",
              creator: { id: "test-user-id", name: "TestUser" },
              players: [{ id: "test-user-id", name: "TestUser" }],
              ruleType: "snooker",
              completed: false,
            }),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
    })

    const { unmount } = render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    await screen.findByText(/Finding a snooker opponent/i)

    unmount()

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tables\/table-seeking-unmount\/delete/),
      expect.objectContaining({ method: "POST" })
    )
  })

  it("should show PlayModal when creator sees table is full in background", async () => {
    // We'll use the real implementation of useLobbyTables but mock fetch to change results
    let tableData = [
      {
        id: "table-full-check",
        creator: { id: "test-user-id", name: "TestUser" },
        players: [{ id: "test-user-id", name: "TestUser" }],
        ruleType: "nineball",
        completed: false,
      },
    ]

    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url === TABLES_API_ENDPOINT) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(tableData),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    })

    const { rerender } = render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    // Simulate table becoming full
    tableData = [
      {
        ...tableData[0],
        players: [
          { id: "test-user-id", name: "TestUser" },
          { id: "other-user", name: "Other" },
        ],
      },
    ]

    // Trigger an update in useLobbyTables.
    // Since useLobbyTables fetches on mount, we need to trigger another fetch.
    // In lobby.test.tsx, LobbyProvider is mocked as just children.
    // So useLobbyMessages is mocked and we can control its return value.
    const { useLobbyMessages } = require("@/contexts/LobbyContext")
    ;(useLobbyMessages as jest.Mock).mockReturnValue({
      lastMessage: { action: "table_updated" },
    })

    // Rerender to trigger useLobbyTables useEffect
    rerender(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
    })
  })

  it("should handle error in findOrCreateTable", async () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { action: "join", ruletype: "nineball" },
      isReady: true,
      push: jest.fn(),
    })

    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/find-or-create")) {
        return Promise.resolve({
          ok: false,
          status: 500,
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

    await waitFor(() => {
      expect(
        screen.queryByText(/Finding a nineball opponent/i)
      ).not.toBeInTheDocument()
    })
  })

  it("should close PlayModal when cancel is clicked", async () => {
    // Force show modal by setting tables state
    let tableData = [
      {
        id: "table-to-close",
        creator: { id: "test-user-id", name: "TestUser" },
        players: [
          { id: "test-user-id", name: "TestUser" },
          { id: "other-user", name: "Other" },
        ],
        ruleType: "nineball",
        completed: false,
      },
    ]

    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url === TABLES_API_ENDPOINT) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(tableData),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    render(
      <LobbyProvider>
        <Lobby />
      </LobbyProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
    })

    const cancelButton = screen.getByText("Cancel")
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText("Opponent Ready")).not.toBeInTheDocument()
    })
  })
})

describe("Lobby Redirection Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      query: {
        username: "TestUser",
        action: "join",
        ruletype: "nineball",
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

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/tables\/find-or-create/),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"ruleType":"nineball"'),
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
    })
  })
})
