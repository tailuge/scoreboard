import React from "react"
import { render, screen } from "@testing-library/react"
import { MatchResultCard } from "../components/MatchResultCard"
import { MatchResult } from "../types/match"

describe("MatchResultCard", () => {
  const mockResult: MatchResult = {
    id: "1",
    winner: "Alice",
    loser: "Bob",
    winnerScore: 100,
    loserScore: 85,
    gameType: "snooker",
    timestamp: new Date("2026-01-26T12:00:00Z").getTime(),
  }

  it("renders winner and loser names", () => {
    render(<MatchResultCard result={mockResult} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("renders scores", () => {
    render(<MatchResultCard result={mockResult} />)
    expect(screen.getByText("100")).toBeInTheDocument()
    expect(screen.getByText("85")).toBeInTheDocument()
  })

  it("renders game type", () => {
    render(<MatchResultCard result={mockResult} />)
    expect(screen.getByText(/snooker/i)).toBeInTheDocument()
  })

  it("renders solo result correctly", () => {
    const soloResult: MatchResult = {
      id: "2",
      winner: "Charlie",
      winnerScore: 50,
      gameType: "nineball",
      timestamp: Date.now(),
    }
    render(<MatchResultCard result={soloResult} />)
    expect(screen.getByText("Charlie")).toBeInTheDocument()
    expect(screen.queryByText("vs")).not.toBeInTheDocument()
    expect(screen.getByText("50")).toBeInTheDocument()
  })

  it("renders in compact mode", () => {
    render(<MatchResultCard result={mockResult} compact={true} />)
    // In compact mode we might hide some elements or change style, 
    // for now just check it still renders
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })
})
