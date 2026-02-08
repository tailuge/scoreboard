import { render, screen, waitFor } from "@testing-library/react"
import Game from "../pages/game"
import { LobbyProvider } from "@/contexts/LobbyContext"

jest.mock("../nchan/nchansub", () => ({
  NchanSub: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}))

jest.mock("../nchan/nchanpub", () => ({
  NchanPub: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(0),
  })),
}))

describe("Game Page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
                gameType: "nineball",
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

    // Check main heading (Removed)
    // expect(screen.getByText("Choose Your Game")).toBeInTheDocument()
    expect(screen.getByText("Highscore Challenge")).toBeInTheDocument()
    expect(screen.getByText("2-Player Online")).toBeInTheDocument()

    // Check for the Highscore Challenge links (strict match to avoid matching "Online" buttons)
    expect(
      screen.getByRole("link", { name: /^Play Snooker$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /^Play Nine Ball$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /^Play Three Cushion$/i })
    ).toBeInTheDocument()

    // Check for the Online buttons (now links)
    expect(
      screen.getByRole("link", { name: /Play Snooker Online/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Play Nine Ball Online/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Play Three Cushion Online/i })
    ).toBeInTheDocument()

    // Check if images are present (using alt text) - now duplicated
    expect(
      screen.getAllByAltText(
        "Play classic Snooker billiards online with 22 balls on a full-size table"
      )
    ).toHaveLength(2)
    expect(
      screen.getAllByAltText(
        "Play 9-Ball pool online - fast-paced pocket billiards game"
      )
    ).toHaveLength(2)
    expect(
      screen.getAllByAltText(
        "Play Three Cushion carom billiards online - no pockets, hit three rails"
      )
    ).toHaveLength(2)

    // Verify LeaderboardTable renders data
    await waitFor(() => {
      expect(screen.getAllByText("TopPlayer")).toHaveLength(3)
    })
  })
})
