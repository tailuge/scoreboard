import { render, screen, waitFor } from "@testing-library/react"
import New from "@/pages/new"
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

jest.mock("@/contexts/LobbyContext", () => ({
  useLobbyMessages: jest.fn(() => ({ lastMessage: null })),
  usePresenceMessages: jest.fn(() => ({ lastMessage: null })),
}))

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

jest.mock("@/components/hooks/usePresenceList", () => ({
  usePresenceList: jest.fn(() => ({
    users: [],
    count: 0,
  })),
}))

describe("New page", () => {
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

  it("renders without crashing", async () => {
    render(<New />)
    await waitFor(() => {
      // Wait for async fetches in LiveMatchesPanel and MatchHistoryList to settle
    })
  })

  it("renders all three game cards", async () => {
    render(<New />)
    await waitFor(() => {
      // Wait for async fetches to settle
    })
    expect(screen.getByText("Snooker")).toBeInTheDocument()
    expect(screen.getByText("Nine Ball")).toBeInTheDocument()
    expect(screen.getByText("Three Cushion")).toBeInTheDocument()
  })

  it("renders Play Online and Practice buttons for each game", async () => {
    render(<New />)
    await waitFor(() => {
      // Wait for async fetches to settle
    })
    expect(
      screen.getByRole("link", { name: /Play Snooker Online/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Practice Snooker/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Play Nine Ball Online/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Practice Nine Ball/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Play Three Cushion Online/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Practice Three Cushion/i })
    ).toBeInTheDocument()
  })

  it("renders option selectors for Snooker and Three Cushion", async () => {
    render(<New />)
    await waitFor(() => {
      // Wait for async fetches to settle
    })
    expect(
      screen.getByRole("radiogroup", { name: /Number of red balls/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("radiogroup", { name: /Race to/i })
    ).toBeInTheDocument()
  })
})
