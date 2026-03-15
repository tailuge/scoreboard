import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { LiveMatchesList } from "../components/LiveMatchesList"
import { useUser } from "@/contexts/UserContext"
import type { ActiveGame } from "@tailuge/messaging"

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))

const mockedUseUser = useUser as jest.Mock

describe("LiveMatchesList", () => {
  const activeGame: ActiveGame = {
    tableId: "table-1",
    players: [
      { id: "player-1", name: "Player One" },
      { id: "player-2", name: "Player Two" },
    ],
    ruleType: "nineball",
  }

  it("renders active games and triggers spectate", () => {
    mockedUseUser.mockReturnValue({
      userId: "user-1",
      userName: "Spectator",
    })
    globalThis.open = jest.fn()

    render(<LiveMatchesList games={[activeGame]} />)

    expect(screen.getByText("Live Games")).toBeInTheDocument()
    expect(screen.getByText("Player One")).toBeInTheDocument()
    expect(screen.getByText("Player Two")).toBeInTheDocument()
    expect(document.querySelector("svg")).toBeInTheDocument()
    expect(document.querySelector("svg text")).toBeInTheDocument()
    expect(screen.queryByText(/nineball/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByText("Live"))
    expect(globalThis.open).toHaveBeenCalled()
  })

  it("renders empty state when there are no active games", () => {
    mockedUseUser.mockReturnValue({
      userId: "user-1",
      userName: "Spectator",
    })

    render(
      <LiveMatchesList
        games={[
          { ...activeGame, players: [{ id: "player-1", name: "Player One" }] },
        ]}
      />
    )

    expect(screen.getByText("Live Games")).toBeInTheDocument()
    expect(screen.getByText("No live games at the moment.")).toBeInTheDocument()
  })
})
