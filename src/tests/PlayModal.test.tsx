import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PlayModal } from "@/components/PlayModal"
import "@testing-library/jest-dom"
import { isInsideIframe } from "@/utils/iframe"
import { useUser } from "@/contexts/UserContext"

jest.mock("@/utils/iframe")
const mockedIsInsideIframe = isInsideIframe as jest.Mock

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

describe("PlayModal", () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    // Mock fetch
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ creator: { id: "user-123" } }),
      })
    ) as jest.Mock

    // Mock globalThis.open
    globalThis.open = jest.fn()

    mockOnClose.mockClear()
    mockedIsInsideIframe.mockReturnValue(false)
    mockedUseUser.mockReturnValue({
      userId: "user-123",
      userName: "test",
      setUserName: jest.fn(),
    })
  })

  it("renders the modal when isOpen is true", () => {
    render(
      <PlayModal
        isOpen={true}
        onClose={mockOnClose}
        tableId="table-1"
        ruleType="nineball"
      />
    )
    expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
    expect(screen.getByText("Start Game")).toBeInTheDocument()
    expect(screen.getByText("Cancel")).toBeInTheDocument()
  })

  it("does not render the modal when isOpen is false", () => {
    render(
      <PlayModal
        isOpen={false}
        onClose={mockOnClose}
        tableId="table-1"
        ruleType="nineball"
      />
    )
    expect(screen.queryByText("Opponent Ready")).not.toBeInTheDocument()
  })

  it('calls onClose and markComplete when "Start Game" is clicked', async () => {
    render(
      <PlayModal
        isOpen={true}
        onClose={mockOnClose}
        tableId="table-1"
        ruleType="nineball"
      />
    )
    fireEvent.click(screen.getByText("Start Game"))
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/tables/table-1/complete",
        { method: "PUT" }
      )
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onClose and does not call markComplete when "Cancel" is clicked', () => {
    render(
      <PlayModal
        isOpen={true}
        onClose={mockOnClose}
        tableId="table-1"
        ruleType="nineball"
      />
    )
    fireEvent.click(screen.getByText("Cancel"))
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('displays an error message when "Start Game" fails', async () => {
    // Mock a failed fetch response
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      })
    ) as jest.Mock

    render(
      <PlayModal
        isOpen={true}
        onClose={mockOnClose}
        tableId="table-1"
        ruleType="nineball"
      />
    )
    fireEvent.click(screen.getByText("Start Game"))

    await waitFor(() => {
      expect(
        screen.getByText("Failed to start the game. Please try again.")
      ).toBeInTheDocument()
    })

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it("renders IFrameOverlay when inside an iframe", async () => {
    mockedIsInsideIframe.mockReturnValue(true)

    render(
      <PlayModal
        isOpen={true}
        onClose={mockOnClose}
        tableId="table-1"
        ruleType="nineball"
      />
    )

    fireEvent.click(screen.getByText("Start Game"))

    await waitFor(() => {
      expect(screen.getByTitle("Game Window")).toBeInTheDocument()
    })

    expect(globalThis.open).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()

    // Click the close button on the iframe overlay
    fireEvent.click(screen.getByText("Close"))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
