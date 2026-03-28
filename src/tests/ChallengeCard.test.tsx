import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { ChallengeCard } from "../components/ChallengeCard"
import { GAME_TYPES } from "@/config"

describe("ChallengeCard", () => {
  const mockOnSelectRule = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the opponent name correctly", () => {
    render(
      <ChallengeCard
        opponentName="Alice"
        onSelectRule={mockOnSelectRule}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText(/Challenge Alice/i)).toBeInTheDocument()
  })

  it("renders 'Player' if opponentName is not provided", () => {
    render(
      <ChallengeCard onSelectRule={mockOnSelectRule} onCancel={mockOnCancel} />
    )
    expect(screen.getByText(/Challenge Player/i)).toBeInTheDocument()
  })

  it("renders all game types from config", () => {
    render(
      <ChallengeCard onSelectRule={mockOnSelectRule} onCancel={mockOnCancel} />
    )
    GAME_TYPES.forEach((game) => {
      expect(screen.getByText(game.name)).toBeInTheDocument()
    })
  })

  it("calls onSelectRule with the correct rule type when a button is clicked", () => {
    render(
      <ChallengeCard onSelectRule={mockOnSelectRule} onCancel={mockOnCancel} />
    )

    const snookerButton = screen.getByText("Snooker")
    fireEvent.click(snookerButton)

    expect(mockOnSelectRule).toHaveBeenCalledWith("snooker")
  })

  it("calls onCancel when the cancel button is clicked", () => {
    render(
      <ChallengeCard onSelectRule={mockOnSelectRule} onCancel={mockOnCancel} />
    )

    const cancelButton = screen.getByRole("button", {
      name: /cancel challenge/i,
    })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })
})
