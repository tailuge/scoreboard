import { render, screen } from "@testing-library/react"
import Game from "../pages/game"

describe("Game Page", () => {
  it("renders the game selection page with 3 buttons", () => {
    render(<Game />)

    // Check main heading
    expect(screen.getByText("Choose Your Game")).toBeInTheDocument()

    // Check for the 3 main game options
    expect(
      screen.getByRole("button", { name: /Play Snooker/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Play Nine Ball/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Play Three Cushion/i })
    ).toBeInTheDocument()

    // Check if images are present (using alt text)
    expect(screen.getByAltText("Snooker Icon")).toBeInTheDocument()
    expect(screen.getByAltText("Nine Ball Icon")).toBeInTheDocument()
    expect(screen.getByAltText("Three Cushion Icon")).toBeInTheDocument()
  })
})
