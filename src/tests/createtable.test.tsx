import { render, screen, fireEvent, act } from "@testing-library/react"
import { CreateTable } from "@/components/createtable"
import "@testing-library/jest-dom"
import { useUser } from "@/contexts/UserContext"

// Mock the useUser hook
jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

// Mock the useServerStatus hook
jest.mock("@/components/hooks/useServerStatus", () => ({
  useServerStatus: jest.fn(() => ({ isOnline: true })),
}))

describe("CreateTable component", () => {
  const mockOnCreate = jest.fn()

  beforeEach(() => {
    // Mock fetch
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock
    mockOnCreate.mockClear()
    mockedUseUser.mockReturnValue({
      userId: "user-1",
      userName: "TestUser",
      setUserName: jest.fn(),
    })
  })

  it("renders the component and creates a table on click", async () => {
    render(<CreateTable onCreate={mockOnCreate} />)

    // Check initial render
    const playButton = screen.getByText("Play Nineball")
    expect(playButton).toBeInTheDocument()
    expect(playButton).toBeEnabled()

    // Simulate click
    await act(async () => {
      fireEvent.click(playButton)
    })

    // Verify fetch and callback
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "user-1",
        userName: "TestUser",
        ruleType: "nineball",
      }),
    })
    expect(mockOnCreate).toHaveBeenCalledTimes(1)
  })

  it("opens the dropdown and changes the game type", () => {
    render(<CreateTable onCreate={mockOnCreate} />)

    const dropdownButton = screen.getByText("▼")
    fireEvent.click(dropdownButton)

    // Dropdown should be open
    const snookerButton = screen.getByText("Snooker")
    expect(snookerButton).toBeInTheDocument()

    // Change game type
    fireEvent.click(snookerButton)

    // Main button text should update
    expect(screen.getByText("Play Snooker")).toBeInTheDocument()
  })
})
