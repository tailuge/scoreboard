import { render, screen, waitFor } from "@testing-library/react"
import Game from "../pages/game"
import { LobbyProvider } from "@/contexts/LobbyContext"
import { useUser } from "@/contexts/UserContext"

jest.mock("../nchan/nchansub", () => ({
  NchanSub: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}))

jest.mock("../nchan/nchanpub", () => ({
  NchanPub: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(0),
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

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

// Mock usePresenceList hook
jest.mock("@/components/hooks/usePresenceList", () => ({
  usePresenceList: jest.fn(() => ({
    users: [],
    count: 0,
  })),
}))

// Mock useLobbyTables hook
jest.mock("@/components/hooks/useLobbyTables", () => ({
  useLobbyTables: jest.fn(() => ({
    tables: [],
    tableAction: jest.fn(),
  })),
}))

describe("Game Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseUser.mockReturnValue({
      userId: "test-user-id",
      userName: "TestUser",
      setUserName: jest.fn(),
    })
    globalThis.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes("/api/rank")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              { id: "1", name: "TopPlayer", score: 999, likes: 0 },
            ]),
          ok: true,
        })
      }
      if (url.includes("/api/match-results")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              {
                id: "1",
                winner: "Alice",
                winnerScore: 10,
                ruleType: "nineball",
                timestamp: Date.now(),
              },
            ]),
          ok: true,
        })
      }
      return Promise.resolve({
        json: () => Promise.resolve([]),
        ok: true,
      })
    })
  })

  it("renders the game selection page with 3 buttons", async () => {
    render(
      <LobbyProvider>
        <Game />
      </LobbyProvider>
    )

    expect(screen.getByText("Play")).toBeInTheDocument()

    expect(
      screen.getByRole("link", { name: /^Play Snooker$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /^Play Nine Ball$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /^Play Three Cushion$/i })
    ).toBeInTheDocument()

    expect(screen.getAllByText("Practice")).toHaveLength(3)
    expect(screen.getAllByText("Online")).toHaveLength(3)

    expect(
      screen.getByAltText(
        "Play classic Snooker billiards online with 22 balls on a full-size table"
      )
    ).toBeInTheDocument()
    expect(
      screen.getByAltText(
        "Play 9-Ball pool online - fast-paced pocket billiards game"
      )
    ).toBeInTheDocument()
    expect(
      screen.getByAltText(
        "Play Three Cushion carom billiards online - no pockets, hit three rails"
      )
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getAllByText("TopPlayer")).toHaveLength(3)
    })
  })
})
