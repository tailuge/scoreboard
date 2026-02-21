import React from "react"
import { render, act, screen, waitFor } from "@testing-library/react"
import {
  LobbyProvider,
  useLobbyMessages,
  usePresenceMessages,
} from "../contexts/LobbyContext"
import { UserProvider, useUser } from "../contexts/UserContext"
import { NchanSub } from "../nchan/nchansub"
import { setupRouterMock } from "./testUtils"

jest.mock("../nchan/nchansub", () => ({
  NchanSub: jest.fn().mockImplementation((channel, callback, type) => ({
    start: jest.fn(),
    stop: jest.fn(),
    _callback: callback,
    _type: type,
  })),
}))

jest.mock("next/router", () => ({ useRouter: jest.fn() }))

describe("LobbyContext", () => {
  let instances: any[] = []

  beforeEach(() => {
    instances = []
    ;(NchanSub as any).mockImplementation(
      (channel: string, callback: any, type: string) => {
        const instance = {
          start: jest.fn(),
          stop: jest.fn(),
          _callback: callback,
          _type: type,
        }
        instances.push(instance)
        return instance
      }
    )
  })

  it("updates lobby messages when NchanSub triggers", async () => {
    const TestComponent = () => {
      const { lastMessage } = useLobbyMessages()
      return <div>{lastMessage ? lastMessage.tableId : "no message"}</div>
    }

    render(
      <LobbyProvider>
        <TestComponent />
      </LobbyProvider>
    )

    const lobbyInstance = instances.find((i) => i._type === "lobby")
    if (!lobbyInstance) throw new Error("lobbyInstance not found")

    await act(async () => {
      lobbyInstance._callback(
        JSON.stringify({ type: "TABLE_UPDATED", tableId: "123" })
      )
    })

    expect(screen.getByText("123")).toBeInTheDocument()
  })

  it("updates presence messages when NchanSub triggers", async () => {
    const TestComponent = () => {
      const { lastMessage } = usePresenceMessages()
      return <div>{lastMessage ? lastMessage.userId : "no message"}</div>
    }

    render(
      <LobbyProvider>
        <TestComponent />
      </LobbyProvider>
    )

    const presenceInstance = instances.find((i) => i._type === "presence")
    if (!presenceInstance) throw new Error("presenceInstance not found")

    act(() => {
      presenceInstance._callback(
        JSON.stringify({
          messageType: "presence",
          type: "join",
          userId: "user-1",
          userName: "User 1",
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText("user-1")).toBeInTheDocument()
    })
  })

  const testInvalidMessage = async (
    type: "lobby" | "presence",
    msg: string
  ) => {
    const parseErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})
    try {
      const TestComponent = () => {
        const lobby = useLobbyMessages()
        const presence = usePresenceMessages()
        const { lastMessage } = type === "lobby" ? lobby : presence
        return <div>{lastMessage ? "has message" : "no message"}</div>
      }
      render(
        <LobbyProvider>
          <TestComponent />
        </LobbyProvider>
      )
      const instance = instances.find((i) => i._type === type)
      if (!instance) throw new Error(`Instance for ${type} not found`)
      act(() => {
        instance._callback(msg)
      })
      await waitFor(() => {
        expect(screen.getByText("no message")).toBeInTheDocument()
      })
    } finally {
      parseErrorSpy.mockRestore()
    }
  }

  it("handles invalid JSON in lobby messages", async () =>
    await testInvalidMessage("lobby", "invalid json"))
  it("handles null parsed message in lobby", async () =>
    await testInvalidMessage("lobby", ""))
  it("handles invalid JSON in presence messages", async () =>
    await testInvalidMessage("presence", "invalid json"))

  it("stops subscriptions on unmount", () => {
    const { unmount } = render(
      <LobbyProvider>
        <div />
      </LobbyProvider>
    )

    unmount()

    instances.forEach((instance) => {
      expect(instance.stop).toHaveBeenCalled()
    })
  })

  it("throws error when useLobbyMessages is used outside provider", () => {
    const TestComponent = () => {
      useLobbyMessages()
      return null
    }

    // Suppress console.error for expected error
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow(
      "useLobbyMessages must be used within a LobbyProvider"
    )
    consoleSpy.mockRestore()
  })

  it("throws error when usePresenceMessages is used outside provider", () => {
    const TestComponent = () => {
      usePresenceMessages()
      return null
    }

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow(
      "usePresenceMessages must be used within a LobbyProvider"
    )
    consoleSpy.mockRestore()
  })

})

describe("UserContext", () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    setupRouterMock({}, false)
  })

  it("provides default user name", () => {
    const TestComponent = () => {
      const { userName } = useUser()
      return <div>{userName}</div>
    }

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    expect(screen.getByText("Anonymous")).toBeInTheDocument()
  })

  it("uses localized name when no name in localStorage", async () => {
    const originalLanguage = navigator.language
    Object.defineProperty(navigator, "language", {
      value: "fr-FR",
      configurable: true,
    })

    const TestComponent = () => {
      const { userName } = useUser()
      return <div>{userName}</div>
    }

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Initially it might be "Anonymous" (SSR state) then update in useEffect
    await waitFor(() => {
      expect(screen.getByText("Anonyme")).toBeInTheDocument()
    })

    // It should NOT be in localStorage
    expect(localStorage.getItem("userName")).toBeNull()

    Object.defineProperty(navigator, "language", {
      value: originalLanguage,
      configurable: true,
    })
  })

  it("upgrades 'Anonymous' in localStorage to localized version", async () => {
    localStorage.setItem("userName", "Anonymous")
    const originalLanguage = navigator.language
    Object.defineProperty(navigator, "language", {
      value: "fr-FR",
      configurable: true,
    })

    const TestComponent = () => {
      const { userName } = useUser()
      return <div>{userName}</div>
    }

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Anonyme")).toBeInTheDocument()
    })

    Object.defineProperty(navigator, "language", {
      value: originalLanguage,
      configurable: true,
    })
  })

  it("loads user name from localStorage", () => {
    localStorage.setItem("userName", "StoredUser")

    const TestComponent = () => {
      const { userName } = useUser()
      return <div>{userName}</div>
    }

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    expect(screen.getByText("StoredUser")).toBeInTheDocument()
  })

  it("updates user name from router query when ready", () => {
    setupRouterMock({ username: "RouterUser" })

    const TestComponent = () => {
      const { userName } = useUser()
      return <div>{userName}</div>
    }

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    expect(screen.getByText("RouterUser")).toBeInTheDocument()
    expect(localStorage.getItem("userName")).toBe("RouterUser")
  })

  it("manually sets user name", async () => {
    const TestComponent = () => {
      const { userName, setUserName } = useUser()
      return (
        <div>
          <span>{userName}</span>
          <button onClick={() => setUserName("NewName")}>Change</button>
        </div>
      )
    }

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    await act(async () => {
      screen.getByText("Change").click()
    })

    expect(screen.getByText("NewName")).toBeInTheDocument()
    expect(localStorage.getItem("userName")).toBe("NewName")
  })

  it("throws error when useUser is used outside provider", () => {
    const TestComponent = () => {
      useUser()
      return null
    }

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow(
      "useUser must be used within a UserProvider"
    )
    consoleSpy.mockRestore()
  })
})
