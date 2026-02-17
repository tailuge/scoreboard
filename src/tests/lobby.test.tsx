import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import Lobby from "../pages/lobby"
import { LobbyProvider, useLobbyMessages } from "@/contexts/LobbyContext"
import { mockTables } from "./mockData"
import { setupRouterMock, setupUserMock, setupLobbyMocks, mockFetchResponse, createFetchMock } from "./testUtils"

// Mock dependencies
jest.mock("next/router", () => ({ useRouter: jest.fn() }))
jest.mock("@/contexts/UserContext", () => ({ useUser: jest.fn() }))
jest.mock("@/utils/usage", () => ({ markUsage: jest.fn() }))
jest.mock("@/nchan/nchansub", () => ({
  NchanSub: jest.fn().mockImplementation(() => ({ start: jest.fn(), stop: jest.fn() })),
}))
jest.mock("@/nchan/nchanpub", () => ({
  NchanPub: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(5),
    post: jest.fn().mockResolvedValue(undefined),
    publishLobby: jest.fn().mockResolvedValue(undefined),
    publishPresence: jest.fn().mockResolvedValue(undefined),
  })),
}))
jest.mock("@/contexts/LobbyContext", () => ({
  LobbyProvider: jest.fn(({ children }) => <>{children}</>),
  useLobbyContext: jest.fn(),
  useLobbyMessages: jest.fn(),
  usePresenceMessages: jest.fn(),
}))
jest.mock("@/components/hooks/usePresenceList", () => ({
  usePresenceList: jest.fn(() => ({ users: [], count: 0 })),
}))

const TABLES_API_ENDPOINT = "/api/tables"

describe("Lobby Component Functional Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupRouterMock({ username: "TestUser" })
    setupUserMock()
    setupLobbyMocks()

    globalThis.fetch = createFetchMock({
      "/api/tables/find-or-create": () => mockFetchResponse(mockTables[0]),
      "/api/tables/join": () => mockFetchResponse(mockTables[0]),
      "/api/tables/spectate": () => mockFetchResponse(mockTables[0]),
      [TABLES_API_ENDPOINT]: () => mockFetchResponse(mockTables),
    })
  })

  it("should show seeking UI when action=join is triggered and no pending table found", async () => {
    setupRouterMock({ action: "join", ruletype: "nineball" })

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
    setupRouterMock()
    setupUserMock()
    setupLobbyMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const setupSeekingMock = (id: string) => {
    globalThis.fetch = createFetchMock({
      "/find-or-create": () => mockFetchResponse({
        id,
        creator: { id: "test-user-id", name: "TestUser" },
        players: [{ id: "test-user-id", name: "TestUser" }],
        ruleType: "snooker",
        completed: false,
      }),
    })
  }

  const verifyTableDeleted = (id: string) => {
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(new RegExp(`/api/tables/${id}/delete`)),
      expect.objectContaining({ method: "POST" })
    )
  }

  it("should timeout after 60 seconds of seeking", async () => {
    const routerPush = jest.fn()
    setupRouterMock({ action: "join", ruletype: "snooker" }, true, routerPush)
    setupSeekingMock("table-seeking-123")

    render(<LobbyProvider><Lobby /></LobbyProvider>)
    await screen.findByText(/Finding a snooker opponent/i)
    act(() => { jest.advanceTimersByTime(60000) })

    await waitFor(() => {
      verifyTableDeleted("table-seeking-123")
      expect(routerPush).toHaveBeenCalledWith("/game")
    })
  })

  it("should call delete API on unmount if seeking", async () => {
    setupRouterMock({ action: "join", ruletype: "snooker" })
    setupSeekingMock("table-seeking-unmount")

    const { unmount } = render(<LobbyProvider><Lobby /></LobbyProvider>)
    await screen.findByText(/Finding a snooker opponent/i)
    unmount()

    verifyTableDeleted("table-seeking-unmount")
  })

  it("should show PlayModal when creator sees table is full in background", async () => {
    let tableData = [{
      id: "table-full-check",
      creator: { id: "test-user-id", name: "TestUser" },
      players: [{ id: "test-user-id", name: "TestUser" }],
      ruleType: "nineball",
      completed: false,
    }]

    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url === TABLES_API_ENDPOINT) return mockFetchResponse(tableData)
      return mockFetchResponse({})
    })

    const { rerender } = render(<LobbyProvider><Lobby /></LobbyProvider>)
    tableData = [{ ...tableData[0], players: [{ id: "test-user-id", name: "TestUser" }, { id: "other-user", name: "Other" }] }]

    ;(useLobbyMessages as jest.Mock).mockReturnValue({ lastMessage: { action: "table_updated" } })

    rerender(<LobbyProvider><Lobby /></LobbyProvider>)
    await waitFor(() => { expect(screen.getByText("Opponent Ready")).toBeInTheDocument() })
  })

  it("should handle error in findOrCreateTable", async () => {
    setupRouterMock({ action: "join", ruletype: "nineball" })
    globalThis.fetch = createFetchMock({ "/find-or-create": () => mockFetchResponse({}, false, 500) })

    render(<LobbyProvider><Lobby /></LobbyProvider>)
    await waitFor(() => { expect(screen.queryByText(/Finding a nineball opponent/i)).not.toBeInTheDocument() })
  })

  it("should close PlayModal when cancel is clicked", async () => {
    const tableData = [{
      id: "table-to-close",
      creator: { id: "test-user-id", name: "TestUser" },
      players: [{ id: "test-user-id", name: "TestUser" }, { id: "other-user", name: "Other" }],
      ruleType: "nineball",
      completed: false,
    }]

    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url === TABLES_API_ENDPOINT) return mockFetchResponse(tableData)
      return mockFetchResponse({})
    })

    render(<LobbyProvider><Lobby /></LobbyProvider>)
    await waitFor(() => { expect(screen.getByText("Opponent Ready")).toBeInTheDocument() })
    fireEvent.click(screen.getByText("Cancel"))
    await waitFor(() => { expect(screen.queryByText("Opponent Ready")).not.toBeInTheDocument() })
  })
})

describe("Lobby Redirection Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupRouterMock({ username: "TestUser", action: "join", ruletype: "nineball" })
    setupUserMock()
    setupLobbyMocks()

    const fullTable = {
      ...mockTables[0],
      players: [
        { id: "creator-1", name: "Creator 1" },
        { id: "test-user-id", name: "TestUser" },
      ],
    }

    globalThis.fetch = createFetchMock({
      "/api/tables/find-or-create": () => mockFetchResponse(fullTable),
      "/api/tables/join": () => mockFetchResponse(fullTable),
      [TABLES_API_ENDPOINT]: () => mockFetchResponse(mockTables),
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
