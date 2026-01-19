import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { PlayModal } from "@/components/PlayModal"
import "@testing-library/jest-dom"

describe("PlayModal", () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ creator: { id: "user-123" } }),
      })
    ) as jest.Mock

    // Mock window.open
    global.open = jest.fn()

    mockOnClose.mockClear()
  })

  it("renders the modal when isOpen is true", () => {
    render(
      <PlayModal
        isOpen={true}
        onClose={mockOnClose}
        tableId="table-1"
        userName="test"
        userId="user-123"
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
        userName="test"
        userId="user-123"
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
        userName="test"
        userId="user-123"
        ruleType="nineball"
      />
    )
    fireEvent.click(screen.getByText("Start Game"))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
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
        userName="test"
        userId="user-123"
        ruleType="nineball"
      />
    )
    fireEvent.click(screen.getByText("Cancel"))
    expect(global.fetch).not.toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
