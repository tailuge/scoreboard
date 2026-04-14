import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { UserProvider, useUser } from "@/contexts/UserContext"
import { getUID } from "@/utils/uid"

jest.mock("@/utils/uid", () => ({
  getUID: jest.fn(),
}))

function UserProbe() {
  const { userId, userName, setUserName } = useUser()

  return (
    <div>
      <div data-testid="user-id">{userId}</div>
      <div data-testid="user-name">{userName}</div>
      <button onClick={() => setUserName("New Name")}>change name</button>
    </div>
  )
}

describe("Identity Stability Reproduction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.sessionStorage.clear()
    globalThis.localStorage.clear()
  })

  it("verifies that name change DOES NOT trigger userId change (new stable behavior)", async () => {
    ;(getUID as jest.Mock)
      .mockReturnValueOnce("initial-id")

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("initial-id")
    })

    fireEvent.click(screen.getByText("change name"))

    await waitFor(() => {
      // userId should remain stable
      expect(screen.getByTestId("user-id")).toHaveTextContent("initial-id")
    })
    expect(screen.getByTestId("user-name")).toHaveTextContent("New Name")
  })
})
