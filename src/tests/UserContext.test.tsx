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
      <button onClick={() => setUserName("Updated User")}>rename</button>
    </div>
  )
}

describe("UserProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.sessionStorage.clear()
    globalThis.localStorage.clear()
  })

  it("creates a fresh session-scoped user id instead of reusing localStorage", async () => {
    ;(getUID as jest.Mock).mockReturnValue("session-user-id")
    globalThis.localStorage.setItem("userId", "legacy-local-user-id")
    globalThis.localStorage.setItem("userName", "Persisted User")

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("session-user-id")
    })
    expect(screen.getByTestId("user-name")).toHaveTextContent("Persisted User")
    expect(globalThis.sessionStorage.getItem("userId")).toBe("session-user-id")
    expect(globalThis.localStorage.getItem("userId")).toBeNull()
  })

  it("stores renamed users in sessionStorage and localStorage correctly", async () => {
    ;(getUID as jest.Mock)
      .mockReturnValueOnce("initial-user-id")
      .mockReturnValueOnce("renamed-user-id")

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("initial-user-id")
    })

    fireEvent.click(screen.getByRole("button", { name: "rename" }))

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("renamed-user-id")
    })
    expect(screen.getByTestId("user-name")).toHaveTextContent("Updated User")
    expect(globalThis.sessionStorage.getItem("userId")).toBe("renamed-user-id")
    expect(globalThis.sessionStorage.getItem("userName")).toBe("Updated User")
    expect(globalThis.localStorage.getItem("userName")).toBe("Updated User")
    expect(globalThis.localStorage.getItem("userId")).toBeNull()
  })
})
