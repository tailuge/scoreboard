import { render, screen } from "@testing-library/react"
import Game from "../pages/game"

describe("Game Page", () => {
  it("renders the game selection page with 3 buttons", () => {
    render(<Game />)

    // Check main heading (Removed)
    // expect(screen.getByText("Choose Your Game")).toBeInTheDocument()
    expect(screen.getByText("Highscore Challenge")).toBeInTheDocument()
    expect(screen.getByText("2-Player Online")).toBeInTheDocument()

    // Check for the Highscore Challenge buttons (strict match to avoid matching "Online" buttons)
    expect(
      screen.getByRole("button", { name: /^Play Snooker$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^Play Nine Ball$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^Play Three Cushion$/i })
    ).toBeInTheDocument()

    // Check for the Online buttons
    expect(
      screen.getByRole("button", { name: /Play Snooker Online/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Play Nine Ball Online/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Play Three Cushion Online/i })
    ).toBeInTheDocument()

    // Check if images are present (using alt text) - now duplicated
    expect(screen.getAllByAltText("Snooker Icon")).toHaveLength(2)
    expect(screen.getAllByAltText("Nine Ball Icon")).toHaveLength(2)
    expect(screen.getAllByAltText("Three Cushion Icon")).toHaveLength(2)
  })
})
