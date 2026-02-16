import { render, screen, waitFor, fireEvent, act } from "@testing-library/react"
import New from "@/pages/new"
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
const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
)
global.fetch = mockFetch as jest.Mock

const mockedUseUser = useUser as jest.Mock

// Helper to wait for all pending promises to flush
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("New page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseUser.mockReturnValue({
      userId: "test-user-id",
      userName: "TestUser",
    })
    mockFetch.mockClear()
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    )
  })

  afterEach(async () => {
    // Flush any pending promises after each test
    await act(async () => {
      await flushPromises()
    })
  })

  it("renders without crashing", async () => {
    await act(async () => {
      render(<New />)
    })
    // Wait for async effects to settle
    await waitFor(() => {
      expect(screen.getByText("Nine Ball")).toBeInTheDocument()
    })
    expect(screen.getByText("Snooker")).toBeInTheDocument()
    expect(screen.getByText("Three Cushion")).toBeInTheDocument()
  })

  it("renders all game cards with correct options", async () => {
    await act(async () => {
      render(<New />)
    })
    // Wait for async effects to settle
    await waitFor(() => {
      expect(screen.getByText("Nine Ball")).toBeInTheDocument()
    })

    // Nine Ball
    expect(screen.getByText("Standard")).toBeInTheDocument()
    expect(screen.getByText("Any")).toBeInTheDocument()

    // Snooker (just numbers now)
    const snookerCard = screen.getByText("Snooker").closest("div.relative")!
    expect(snookerCard).toHaveTextContent("3")
    expect(snookerCard).toHaveTextContent("6")
    expect(snookerCard).toHaveTextContent("15")

    // Three Cushion (just numbers now)
    const threeCushionCard = screen
      .getByText("Three Cushion")
      .closest("div.relative")!
    expect(threeCushionCard).toHaveTextContent("3")
    expect(threeCushionCard).toHaveTextContent("5")
    expect(threeCushionCard).toHaveTextContent("7")
  })

  it("links to play online and practice have correct params", async () => {
    await act(async () => {
      render(<New />)
    })
    // Wait for async effects to settle
    await waitFor(() => {
      expect(screen.getByText("Nine Ball")).toBeInTheDocument()
    })

    const nineballPlay = screen.getByLabelText("Play Nine Ball Online")
    expect(nineballPlay).toHaveAttribute(
      "href",
      expect.stringContaining("ruletype=nineball")
    )

    const snookerPlay = screen.getByLabelText("Play Snooker Online")
    expect(snookerPlay).toHaveAttribute(
      "href",
      expect.stringContaining("ruletype=snooker")
    )

    const threecushionPlay = screen.getByLabelText("Play Three Cushion Online")
    expect(threecushionPlay).toHaveAttribute(
      "href",
      expect.stringContaining("ruletype=threecushion")
    )
  })

  it("updates param when option is selected", async () => {
    await act(async () => {
      render(<New />)
    })
    // Wait for async effects to settle
    await waitFor(() => {
      expect(screen.getByText("Nine Ball")).toBeInTheDocument()
    })

    // Snooker default is 6. Click 3.
    // Since there are multiple "3"s, we need to find the one in the Snooker card
    // But for simplicity in this test, we can use getAllByText and pick one,
    // or just use a unique one like "15"
    const fifteenBtn = screen.getByText("15")
    fireEvent.click(fifteenBtn)

    const snookerPlay = screen.getByLabelText("Play Snooker Online")
    expect(snookerPlay).toHaveAttribute(
      "href",
      expect.stringContaining("reds=15")
    )
  })

  it("renders RecentGamesList", async () => {
    await act(async () => {
      render(<New />)
    })
    await waitFor(() => {
      expect(screen.getByText("No active or recent games.")).toBeInTheDocument()
    })
  })
})
