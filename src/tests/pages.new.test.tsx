import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import New from "@/pages/new" // Adjust path if needed
import { useUser } from "@/contexts/UserContext"

// Mock dependencies
jest.mock("@/components/hooks/usePresenceList", () => ({
  usePresenceList: jest.fn(() => ({
    users: [],
    count: 0,
  })),
}))

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))

jest.mock("@/components/hooks/useLobbyTables", () => ({
  useLobbyTables: jest.fn(() => ({
    tables: [],
    tableAction: jest.fn(),
  })),
}))

// Mock fetch for RecentGamesList
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock

const mockedUseUser = useUser as jest.Mock

describe("New page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseUser.mockReturnValue({
      userId: "test-user-id",
      userName: "TestUser",
    })
  })

  it("renders without crashing", () => {
    render(<New />)

    expect(screen.getByText("Nine Ball")).toBeInTheDocument()
    expect(screen.getByText("Snooker")).toBeInTheDocument()
    expect(screen.getByText("Three Cushion")).toBeInTheDocument()
  })

  it("renders all game cards with correct options", () => {
    render(<New />)

    // Nine Ball
    expect(screen.getByText("Standard")).toBeInTheDocument()
    expect(screen.getByText("Any")).toBeInTheDocument()

    // Snooker
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("15")).toBeInTheDocument()

    // Three Cushion
    expect(screen.getByText("Race to 3")).toBeInTheDocument()
    expect(screen.getByText("Race to 5")).toBeInTheDocument()
    expect(screen.getByText("Race to 7")).toBeInTheDocument()
  })

  it("links to play online and practice have correct params", () => {
    render(<New />)

    const nineballPlay = screen.getByLabelText("Play Nine Ball Online")
    expect(nineballPlay).toHaveAttribute("href", expect.stringContaining("ruletype=nineball"))

    const snookerPlay = screen.getByLabelText("Play Snooker Online")
    expect(snookerPlay).toHaveAttribute("href", expect.stringContaining("ruletype=snooker"))

    const threecushionPlay = screen.getByLabelText("Play Three Cushion Online")
    expect(threecushionPlay).toHaveAttribute("href", expect.stringContaining("ruletype=threecushion"))
  })

  it("updates param when option is selected", () => {
    render(<New />)

    // Snooker default is 6 reds. Click 3 reds.
    const threeRedsBtn = screen.getByText("3")
    fireEvent.click(threeRedsBtn)

    const snookerPlay = screen.getByLabelText("Play Snooker Online")
    expect(snookerPlay).toHaveAttribute("href", expect.stringContaining("reds=3"))
  })

  it("renders RecentGamesList", async () => {
    render(<New />)
    // We mocked fetch to return empty array, so we expect "No active or recent games."
    await waitFor(() => {
      expect(screen.getByText("No active or recent games.")).toBeInTheDocument()
    })
  })
})
