import { render, screen, fireEvent } from "@testing-library/react"
import { IFrameOverlay } from "@/components/IFrameOverlay"
import "@testing-library/jest-dom"

describe("IFrameOverlay", () => {
  const mockOnClose = jest.fn()
  const target = new URL("https://example.com")
  const title = "Test IFrame"

  it("renders correctly", () => {
    render(<IFrameOverlay target={target} onClose={mockOnClose} title={title} />)

    const iframe = screen.getByTitle(title)
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute("src", target.toString())

    const closeButton = screen.getByText("Close")
    expect(closeButton).toBeInTheDocument()
  })

  it("calls onClose when close button is clicked", () => {
    render(<IFrameOverlay target={target} onClose={mockOnClose} title={title} />)

    const closeButton = screen.getByText("Close")
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
