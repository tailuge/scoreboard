import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { LiveMatchesList } from "../components/LiveMatchesList"
import { Table } from "@/types/table"
import { useUser } from "@/contexts/UserContext"

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))

const mockedUseUser = useUser as jest.Mock

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
    mockedUseUser.mockReturnValue({
      userId: "user-1",
      userName: "Spectator",
    })
    globalThis.open = jest.fn()

    render(<LiveMatchesList tables={[activeTable]} onSpectate={onSpectate} />)

    expect(screen.getByText("Live Games")).toBeInTheDocument()
    expect(screen.getByText("Player One")).toBeInTheDocument()
    expect(screen.getByText("Player Two")).toBeInTheDocument()
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "/assets/nineball.png"
    )
    expect(screen.queryByText(/nineball/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByText("LIVE"))
    expect(onSpectate).toHaveBeenCalledWith("table-1")
    expect(globalThis.open).toHaveBeenCalled()
  })

  it("renders nothing when there are no active games", () => {
    const onSpectate = jest.fn()
    mockedUseUser.mockReturnValue({
      userId: "user-1",
      userName: "Spectator",
    })

    render(
      <LiveMatchesList
        tables={[{ ...activeTable, completed: false }]}
        onSpectate={onSpectate}
      />
    )

    expect(screen.queryByText("Live Games")).not.toBeInTheDocument()
  })
})
