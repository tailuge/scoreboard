import { render, screen, fireEvent } from "@testing-library/react"
import { Star } from "@/components/Star"
import "@testing-library/jest-dom"

describe("Star component", () => {
  it("opens the GitHub repository in a new tab when clicked", () => {
    // Mock window.open
    const mockOpen = jest.fn()
    globalThis.open = mockOpen

    render(<Star />)

    // Find and click the button
    const starButton = screen.getByRole("button", {
      name: "Star the repository on GitHub (opens in a new tab)",
    })
    fireEvent.click(starButton)

    // Verify window.open was called
    expect(mockOpen).toHaveBeenCalledWith(
      "https://github.com/tailuge/billiards",
      "_blank"
    )
  })
})
