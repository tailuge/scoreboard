import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { LiveMatchesList } from "../components/LiveMatchesList"
import { Table } from "@/types/table"

describe("LiveMatchesList", () => {
  const activeTable: Table = {
    id: "table-1",
    creator: { id: "creator-1", name: "Creator 1" },
    players: [
      { id: "player-1", name: "Player One" },
      { id: "player-2", name: "Player Two" },
    ],
    spectators: [],
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    isActive: true,
    ruleType: "nineball",
    completed: true,
  }

  it("renders active games and triggers spectate", () => {
    const onSpectate = jest.fn()

    render(<LiveMatchesList tables={[activeTable]} onSpectate={onSpectate} />)

    expect(screen.getByText("Live Games")).toBeInTheDocument()
    expect(screen.getByText("Player One")).toBeInTheDocument()
    expect(screen.getByText("Player Two")).toBeInTheDocument()

    fireEvent.click(screen.getByText("LIVE"))
    expect(onSpectate).toHaveBeenCalledWith("table-1")
  })

  it("renders nothing when there are no active games", () => {
    const onSpectate = jest.fn()

    render(
      <LiveMatchesList
        tables={[{ ...activeTable, completed: false }]}
        onSpectate={onSpectate}
      />
    )

    expect(screen.queryByText("Live Games")).not.toBeInTheDocument()
  })
})
