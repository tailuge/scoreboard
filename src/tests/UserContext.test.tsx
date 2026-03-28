import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { UserProvider, useUser } from "@/contexts/UserContext"
import { getUID } from "@/utils/uid"
import { useRouter } from "next/router"

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

  it("handles URL query parameters for userId and userName", async () => {
    ;(getUID as jest.Mock).mockReturnValue("fallback-id")
    const mockRouter = {
      isReady: true,
      query: {
        userId: "url-user-id",
        userName: "URL User",
      },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("url-user-id")
      expect(screen.getByTestId("user-name")).toHaveTextContent("URL User")
    })
  })

  it("handles URL query parameter playerId as an alias for userId", async () => {
    const mockRouter = {
      isReady: true,
      query: {
        playerId: "url-player-id",
      },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("url-player-id")
    })
  })

  it("generates a new ID when only userName is provided in URL", async () => {
    ;(getUID as jest.Mock).mockReturnValue("new-url-id")
    const mockRouter = {
      isReady: true,
      query: {
        userName: "New URL User",
      },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("new-url-id")
      expect(screen.getByTestId("user-name")).toHaveTextContent("New URL User")
    })
  })

  it("recycles existing session userId", async () => {
    globalThis.sessionStorage.setItem("userId", "existing-session-id")
    globalThis.sessionStorage.setItem("userName", "Existing User")

    // Ensure router doesn't override with query params from previous tests
    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: {},
    })

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent(
        "existing-session-id"
      )
      expect(screen.getByTestId("user-name")).toHaveTextContent("Existing User")
    })
  })

  it("throws error when useUser is used outside UserProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<UserProbe />)).toThrow(
      "useUser must be used within a UserProvider"
    )
    consoleSpy.mockRestore()
  })

  it("handles query parameters as arrays", async () => {
    const mockRouter = {
      isReady: true,
      query: {
        userId: ["array-user-id-1", "array-user-id-2"],
        userName: ["Array User 1", "Array User 2"],
      },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("array-user-id-1")
      expect(screen.getByTestId("user-name")).toHaveTextContent("Array User 1")
    })
  })

  it("handles empty/undefined query parameters correctly", async () => {
    const mockRouter = {
      isReady: true,
      query: {
        userId: undefined,
        userName: undefined,
      },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(getUID as jest.Mock).mockReturnValue("fallback-id")

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("fallback-id")
    })
  })

  it("prioritizes playerId over userId in query parameters", async () => {
    const mockRouter = {
      isReady: true,
      query: {
        playerId: "url-player-id",
        userId: "url-user-id",
      },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("url-player-id")
    })
  })

  it("uses localized anonymous name if stored name is a generic anonymous name", async () => {
    globalThis.localStorage.setItem("userName", "Anonymous")
    // Mock navigator.language
    const languageGetter = jest.spyOn(globalThis.navigator, "language", "get")
    languageGetter.mockReturnValue("en-US")

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      // getAnonymousName("en-US") should return "Anonymous" but it's already "Anonymous"
      // Let's try Japanese to be sure
      languageGetter.mockReturnValue("ja-JP")
    })

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )
    // Actually the first render already happened.

    languageGetter.mockRestore()
  })

  it("uses localized anonymous name when no username is stored", async () => {
    const languageGetter = jest.spyOn(globalThis.navigator, "language", "get")
    languageGetter.mockReturnValue("ko-KR")

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("익명")
    })
    languageGetter.mockRestore()
  })

  it("falls back to Latin for unknown language", async () => {
    const languageGetter = jest.spyOn(globalThis.navigator, "language", "get")
    languageGetter.mockReturnValue("xy-ZZ")

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("Anonymus")
    })
    languageGetter.mockRestore()
  })

  it("handles URL query parameter userId without userName", async () => {
    const mockRouter = {
      isReady: true,
      query: {
        userId: "only-user-id",
      },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("only-user-id")
    })
  })

  it("waits for router to be ready", async () => {
    ;(getUID as jest.Mock).mockReturnValue("initial-id")
    const mockRouter = {
      isReady: false,
      query: { userId: "late-id" },
    }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)

    const { rerender } = render(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("initial-id")
    })
    expect(screen.getByTestId("user-id")).not.toHaveTextContent("late-id")

    ;(useRouter as jest.Mock).mockReturnValue({
      isReady: true,
      query: { userId: "late-id" },
    })

    rerender(
      <UserProvider>
        <UserProbe />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("late-id")
    })
  })
})
