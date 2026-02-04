import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TableList } from "../components/tablelist"
import { Table } from "../types/table"
import { useUser } from "@/contexts/UserContext"

// Mock the useUser hook
jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

describe("TableList", () => {
  const mockTables: Table[] = [
    {
      id: "1",
      creator: { id: "user1", name: "User 1" },
      players: [{ id: "user1", name: "User 1" }],
      spectators: [],
      createdAt: 2000,
      lastUsedAt: 2000,
      isActive: true,
      ruleType: "nineball",
      completed: false,
    },
    {
      id: "2",
      creator: { id: "user2", name: "User 2" },
      players: [{ id: "user2", name: "User 2" }],
      spectators: [],
      createdAt: 1000,
      lastUsedAt: 1000,
      isActive: true,
      ruleType: "snooker",
      completed: false,
    },
    {
      id: "3",
      creator: { id: "user3", name: "User 3" },
      players: [{ id: "user3", name: "User 3" }],
      spectators: [],
      createdAt: 3000,
      lastUsedAt: 3000,
      isActive: true,
      ruleType: "threecushion",
      completed: false,
    },
  ]

  beforeEach(() => {
    mockedUseUser.mockReturnValue({
      userId: "test-user",
      userName: "Test User",
      setUserName: jest.fn(),
    })
  })

  it("renders tables in ascending order of createdAt", () => {
    render(
      <TableList
        onJoin={jest.fn()}
        onSpectate={jest.fn()}
        tables={mockTables}
      />
    )

    const tableTitles = screen.getAllByText(/nineball|snooker|threecushion/i)
    expect(tableTitles[0]).toHaveTextContent("snooker") // createdAt: 1000
    expect(tableTitles[1]).toHaveTextContent("nineball") // createdAt: 2000
    expect(tableTitles[2]).toHaveTextContent("threecushion") // createdAt: 3000
  })

  it("handles join table failure", async () => {
    const onJoinMock = jest.fn().mockResolvedValue(false)
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})

    render(
      <TableList
        onJoin={onJoinMock}
        onSpectate={jest.fn()}
        tables={[mockTables[0]]}
      />
    )

    const joinButton = screen.getByLabelText("Join Table")
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(onJoinMock).toHaveBeenCalledWith("1")
      expect(consoleSpy).toHaveBeenCalledWith("Failed to join table:", "1")
    })

    consoleSpy.mockRestore()
  })
})
