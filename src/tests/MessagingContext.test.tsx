import React from "react"
import { render, waitFor, act } from "@testing-library/react"
import { MessagingProvider, useMessaging } from "@/contexts/MessagingContext"
import { useUser } from "@/contexts/UserContext"
import { MessagingClient } from "@tailuge/messaging"

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))

// Use the existing mock for utility functions but mock the Client class
jest.mock("@tailuge/messaging", () => {
  const actual = jest.requireActual("@/tests/__mocks__/@tailuge/messaging")
  return {
    ...actual,
    MessagingClient: jest.fn(),
  }
})

describe("MessagingContext", () => {
  let mockLobby: any
  let mockClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockLobby = {
      currentUser: { userId: "user-1" },
      onUsersChange: jest.fn(),
      onChallenge: jest.fn(),
      onChat: jest.fn(),
      offUsersChange: jest.fn(),
      leave: jest.fn().mockResolvedValue(undefined),
      challenge: jest.fn().mockResolvedValue("table-1"),
      acceptChallenge: jest.fn().mockResolvedValue(undefined),
      declineChallenge: jest.fn().mockResolvedValue(undefined),
      cancelChallenge: jest.fn().mockResolvedValue(undefined),
      updatePresence: jest.fn().mockResolvedValue(undefined),
      sendChat: jest.fn().mockResolvedValue(undefined),
    }

    mockClient = {
      start: jest.fn(),
      stop: jest.fn(),
      joinLobby: jest.fn().mockResolvedValue(mockLobby),
    }
    ;(MessagingClient as jest.Mock).mockImplementation(() => mockClient)
    ;(useUser as jest.Mock).mockReturnValue({
      userId: "user-1",
      userName: "User One",
    })
  })

  function TestComponent({ callback }: { callback: (messaging: any) => void }) {
    const messaging = useMessaging()
    callback(messaging)
    return null
  }

  it("initializes and joins lobby", async () => {
    render(
      <MessagingProvider>
        <div />
      </MessagingProvider>
    )

    expect(mockClient.start).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockClient.joinLobby).toHaveBeenCalledWith({
        messageType: "presence",
        type: "join",
        userId: "user-1",
        userName: "User One",
      })
    })
  })

  it("cleans up on unmount", async () => {
    const { unmount } = render(
      <MessagingProvider>
        <div />
      </MessagingProvider>
    )

    unmount()
    expect(mockClient.stop).toHaveBeenCalledWith({ isTeardown: true })
  })

  it("handles user change events", async () => {
    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.onUsersChange).toHaveBeenCalled())

    const onUsersChangeHandler = mockLobby.onUsersChange.mock.calls[0][0]
    const mockUsers = [{ userId: "user-2", userName: "User Two" }]

    act(() => {
      onUsersChangeHandler(mockUsers)
    })

    expect(capturedMessaging.users).toEqual(mockUsers)
  })

  it("handles challenge events", async () => {
    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.onChallenge).toHaveBeenCalled())
    const onChallengeHandler = mockLobby.onChallenge.mock.calls[0][0]

    // Offer
    const offer = {
      messageType: "challenge",
      type: "offer",
      challengerId: "user-2",
      recipientId: "user-1",
      ruleType: "nineball",
      tableId: "table-1",
    }
    act(() => {
      onChallengeHandler(offer)
    })
    expect(capturedMessaging.incomingChallenge).toEqual(offer)

    // Accept
    const accept = { ...offer, type: "accept" }
    act(() => {
      onChallengeHandler(accept)
    })
    expect(capturedMessaging.acceptedChallenge).toEqual(accept)
    expect(capturedMessaging.pendingChallenge).toBeNull()

    // Decline
    const decline = { ...offer, type: "decline" }
    act(() => {
      onChallengeHandler(decline)
    })
    expect(capturedMessaging.incomingChallenge).toBeNull()
    expect(capturedMessaging.acceptedChallenge).toBeNull()
  })

  it("handles chat events and duplicate filtering", async () => {
    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.onChat).toHaveBeenCalled())
    const onChatHandler = mockLobby.onChat.mock.calls[0][0]

    const chat1 = {
      messageType: "chat",
      senderId: "user-2",
      recipientId: "user-1",
      text: "hello",
      meta: { ts: 1000 },
    }

    act(() => {
      onChatHandler(chat1)
    })

    expect(capturedMessaging.chats["user-2"]).toEqual([chat1])
    expect(capturedMessaging.unreadUsers).toContain("user-2")

    // Duplicate (within 5s)
    const chat2 = { ...chat1, meta: { ts: 2000 } }
    act(() => {
      onChatHandler(chat2)
    })
    expect(capturedMessaging.chats["user-2"]).toHaveLength(1)

    // Not duplicate (after 5s)
    const chat3 = { ...chat1, meta: { ts: 7000 } }
    act(() => {
      onChatHandler(chat3)
    })
    expect(capturedMessaging.chats["user-2"]).toHaveLength(2)
  })

  it("provides functional challenge methods", async () => {
    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.challenge).toBeDefined())

    await act(async () => {
      await capturedMessaging.challenge("user-2", "nineball")
    })
    expect(mockLobby.challenge).toHaveBeenCalledWith(
      "user-2",
      "nineball",
      undefined
    )
    expect(capturedMessaging.pendingChallenge).toMatchObject({
      recipientId: "user-2",
      ruleType: "nineball",
    })

    await act(async () => {
      await capturedMessaging.acceptChallenge("user-2", "nineball", "table-1")
    })
    expect(mockLobby.acceptChallenge).toHaveBeenCalled()

    await act(async () => {
      await capturedMessaging.declineChallenge("user-2", "nineball")
    })
    expect(mockLobby.declineChallenge).toHaveBeenCalled()

    await act(async () => {
      await capturedMessaging.cancelChallenge("user-2", "nineball")
    })
    expect(mockLobby.cancelChallenge).toHaveBeenCalled()
  })

  it("handles sendChat and markChatAsRead", async () => {
    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.sendChat).toBeDefined())

    await act(async () => {
      await capturedMessaging.sendChat("user-2", "hi")
    })
    expect(mockLobby.sendChat).toHaveBeenCalledWith("user-2", "hi")
    expect(capturedMessaging.chats["user-2"]).toContainEqual(
      expect.objectContaining({ text: "hi", senderId: "user-1" })
    )

    // Mock unread
    const onChatHandler = mockLobby.onChat.mock.calls[0][0]
    act(() => {
      onChatHandler({
        messageType: "chat",
        senderId: "user-2",
        recipientId: "user-1",
        text: "yo",
        meta: { ts: Date.now() },
      })
    })
    expect(capturedMessaging.unreadUsers).toContain("user-2")

    act(() => {
      capturedMessaging.markChatAsRead("user-2")
    })
    expect(capturedMessaging.unreadUsers).not.toContain("user-2")
  })

  it("handles updatePresence", async () => {
    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.updatePresence).toBeDefined())

    await act(async () => {
      await capturedMessaging.updatePresence({ tableId: "table-123" })
    })
    expect(mockLobby.updatePresence).toHaveBeenCalledWith({
      tableId: "table-123",
    })
  })

  it("handles lobby join failure", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    mockClient.joinLobby.mockRejectedValueOnce(new Error("Join failed"))

    render(
      <MessagingProvider>
        <div />
      </MessagingProvider>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to join lobby",
        expect.any(Object)
      )
    })
    consoleSpy.mockRestore()
  })

  it("throws error when lobby not initialized for actions", async () => {
    // Prevent lobby from being initialized by not providing userId
    ;(useUser as jest.Mock).mockReturnValue({
      userId: null,
      userName: null,
    })

    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await expect(capturedMessaging.challenge("u2", "9b")).rejects.toThrow(
      "Lobby not initialized"
    )
    await expect(
      capturedMessaging.acceptChallenge("u2", "9b", "t1")
    ).rejects.toThrow("Lobby not initialized")
    await expect(
      capturedMessaging.declineChallenge("u2", "9b")
    ).rejects.toThrow("Lobby not initialized")
    await expect(capturedMessaging.cancelChallenge("u2", "9b")).rejects.toThrow(
      "Lobby not initialized"
    )
    await expect(capturedMessaging.updatePresence({})).rejects.toThrow(
      "Lobby not initialized"
    )
    await expect(capturedMessaging.sendChat("u2", "hi")).rejects.toThrow(
      "Lobby not initialized"
    )
  })

  it("handles lobby re-joining when userId changes", async () => {
    const { rerender } = render(
      <MessagingProvider>
        <div />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockClient.joinLobby).toHaveBeenCalledTimes(1))
    ;(useUser as jest.Mock).mockReturnValue({
      userId: "user-new",
      userName: "User New",
    })

    rerender(
      <MessagingProvider>
        <div />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.leave).toHaveBeenCalled())
    await waitFor(() => expect(mockClient.joinLobby).toHaveBeenCalledTimes(2))
    expect(mockClient.joinLobby).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: "user-new" })
    )
  })

  it("handles clearAcceptedChallenge", async () => {
    let capturedMessaging: any
    render(
      <MessagingProvider>
        <TestComponent callback={(m) => (capturedMessaging = m)} />
      </MessagingProvider>
    )

    await waitFor(() => expect(mockLobby.onChallenge).toHaveBeenCalled())
    const onChallengeHandler = mockLobby.onChallenge.mock.calls[0][0]

    act(() => {
      onChallengeHandler({
        messageType: "challenge",
        type: "accept",
        challengerId: "user-1",
        recipientId: "user-2",
        tableId: "table-1",
      })
    })
    expect(capturedMessaging.acceptedChallenge).not.toBeNull()

    act(() => {
      capturedMessaging.clearAcceptedChallenge()
    })
    expect(capturedMessaging.acceptedChallenge).toBeNull()
  })

  it("throws error when useMessaging is used outside provider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TestComponent callback={() => {}} />)).toThrow(
      "useMessaging must be used within a MessagingProvider"
    )
    consoleSpy.mockRestore()
  })
})
