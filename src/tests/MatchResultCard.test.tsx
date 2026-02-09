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
    expect(screen.getByText("(100)")).toBeInTheDocument()
    expect(screen.getByText("(85)")).toBeInTheDocument()
  })

  it("does not render game type text", () => {
    render(<MatchResultCard result={mockResult} />)
    expect(screen.queryByText(/snooker/i)).not.toBeInTheDocument()
  })

  it("renders correct icon for game type", () => {
    const nineballResult: MatchResult = {
      ...mockResult,
      id: "nineball-1",
      gameType: "nineball",
    }
    const { rerender } = render(<MatchResultCard result={nineballResult} />)
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      expect.stringContaining("nineball.png")
    )

    const snookerResult: MatchResult = {
      ...mockResult,
      id: "snooker-1",
      gameType: "snooker",
    }
    rerender(<MatchResultCard result={snookerResult} />)
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      expect.stringContaining("snooker.png")
    )

    const threeCushionResult: MatchResult = {
      ...mockResult,
      id: "3c-1",
      gameType: "threecushion",
    }
    rerender(<MatchResultCard result={threeCushionResult} />)
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      expect.stringContaining("threecushion.png")
    )

    const eightballResult: MatchResult = {
      ...mockResult,
      id: "8ball-1",
      gameType: "eightball",
    }
    rerender(<MatchResultCard result={eightballResult} />)
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      expect.stringContaining("eightball.png")
    )
  })

  it("renders country flag when location is provided", () => {
    const resultWithCountry: MatchResult = {
      ...mockResult,
      id: "flag-test",
      locationCountry: "DE", // Germany
      locationCity: "Berlin", // City should be visible too
    }
    render(<MatchResultCard result={resultWithCountry} />)
    // "DE" -> 🇩🇪
    expect(screen.getByText("🇩🇪")).toBeInTheDocument()
    expect(screen.getByText("Berlin")).toBeInTheDocument()
    expect(screen.getByTitle("DE")).toBeInTheDocument()
  })

  it("has the correct border classes", () => {
    const { container } = render(<MatchResultCard result={mockResult} />)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass("border-b")
    expect(card).toHaveClass("border-gray-800")
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
    expect(screen.queryByText("50")).not.toBeInTheDocument()
  })

  it("renders in compact mode", () => {
    render(<MatchResultCard result={mockResult} compact={true} />)
    // In compact mode we might hide some elements or change style,
    // for now just check it still renders
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("renders replay badge when replay is available", () => {
    const replayResult: MatchResult = {
      ...mockResult,
      id: "replay-1",
      hasReplay: true,
    }
    render(<MatchResultCard result={replayResult} />)
    const badge = screen.getByRole("link", { name: /replay/i })

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute("href", "/api/match-replay?id=replay-1")
    expect(badge).toHaveAttribute("target", "_blank")
    expect(badge).toHaveAttribute("rel", "noreferrer")
  })

  it("does not render replay badge when replay is missing", () => {
    render(<MatchResultCard result={mockResult} />)
    expect(screen.queryByRole("link", { name: /replay/i })).toBeNull()
  })

  it("handles re-renders with same or different props for memoization", () => {
    const { rerender } = render(<MatchResultCard result={mockResult} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()

    // Same props
    rerender(<MatchResultCard result={mockResult} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()

    // Different props
    rerender(<MatchResultCard result={mockResult} compact={true} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()

    const differentResult = { ...mockResult, id: "different" }
    rerender(<MatchResultCard result={differentResult} compact={true} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })
})
