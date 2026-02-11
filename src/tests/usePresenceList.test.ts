import { renderHook, act } from "@testing-library/react"
import { usePresenceList } from "../components/hooks/usePresenceList"
import { usePresenceMessages } from "@/contexts/LobbyContext"
import { NchanPub } from "@/nchan/nchanpub"
import type { PresenceMessage } from "@/nchan/types"

jest.mock("@/contexts/LobbyContext", () => ({
  usePresenceMessages: jest.fn(),
}))

jest.mock("@/nchan/nchanpub", () => ({
  NchanPub: jest.fn(),
}))

describe("usePresenceList", () => {
  const userId = "user-1"
  const userName = "User One"
  let mockPublishPresence: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockPublishPresence = jest.fn().mockResolvedValue({})
    ;(NchanPub as jest.Mock).mockImplementation(() => ({
      publishPresence: mockPublishPresence,
    }))
    ;(usePresenceMessages as jest.Mock).mockReturnValue({ lastMessage: null })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe("initialization", () => {
    it("should return empty users array initially", () => {
      const { result } = renderHook(() => usePresenceList(userId, userName))

      expect(result.current.users).toEqual([])
    })

    it("should publish join message on mount", () => {
      renderHook(() => usePresenceList(userId, userName))

      expect(mockPublishPresence).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "join",
          userId,
          userName,
        })
      )
    })

    it("should default userName to 'Anonymous' when not provided", () => {
      renderHook(() => usePresenceList(userId))

      expect(mockPublishPresence).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "join",
          userId,
          userName: "Anonymous",
        })
      )
    })
  })

  describe("heartbeat", () => {
    it("should publish heartbeat every 60 seconds", () => {
      renderHook(() => usePresenceList(userId, userName))

      expect(mockPublishPresence).toHaveBeenCalledTimes(1) // join

      act(() => {
        jest.advanceTimersByTime(60000)
      })

      expect(mockPublishPresence).toHaveBeenCalledTimes(2)
      expect(mockPublishPresence).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: "heartbeat",
          userId,
          userName,
        })
      )

      act(() => {
        jest.advanceTimersByTime(60000)
      })

      expect(mockPublishPresence).toHaveBeenCalledTimes(3)
    })

    it("should stop heartbeat on unmount", () => {
      const { unmount } = renderHook(() => usePresenceList(userId, userName))

      unmount()

      act(() => {
        jest.advanceTimersByTime(120000)
      })

      // Only join was called, no heartbeats after unmount
      expect(mockPublishPresence).toHaveBeenCalledTimes(1)
    })
  })

  describe("message handling", () => {
    it("should add user on join message", () => {
      const { result, rerender } = renderHook(() =>
        usePresenceList(userId, userName)
      )

      const joinMessage: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-2",
        userName: "User Two",
        timestamp: Date.now(),
      }

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: joinMessage,
        })
        rerender()
      })

      expect(result.current.users).toEqual([
        { userId: "user-2", userName: "User Two" },
      ])
    })

    it("should update user on heartbeat message", () => {
      const { result, rerender } = renderHook(() =>
        usePresenceList(userId, userName)
      )

      const joinMessage: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-2",
        userName: "User Two",
        timestamp: Date.now() - 1000,
      }

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: joinMessage,
        })
        rerender()
      })

      const heartbeatMessage: PresenceMessage = {
        messageType: "presence",
        type: "heartbeat",
        userId: "user-2",
        userName: "Updated Name",
        timestamp: Date.now(),
      }

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: heartbeatMessage,
        })
        rerender()
      })

      expect(result.current.users).toEqual([
        { userId: "user-2", userName: "Updated Name" },
      ])
    })

    it("should remove user on leave message", () => {
      const { result, rerender } = renderHook(() =>
        usePresenceList(userId, userName)
      )

      const joinMessage: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-2",
        userName: "User Two",
        timestamp: Date.now(),
      }

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: joinMessage,
        })
        rerender()
      })

      expect(result.current.users).toHaveLength(1)

      const leaveMessage: PresenceMessage = {
        messageType: "presence",
        type: "leave",
        userId: "user-2",
        userName: "User Two",
      }

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: leaveMessage,
        })
        rerender()
      })

      expect(result.current.users).toHaveLength(0)
    })

    it("should sort users by lastSeen descending", () => {
      const { result, rerender } = renderHook(() =>
        usePresenceList(userId, userName)
      )

      const now = Date.now()

      const message1: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-1",
        userName: "User One",
        timestamp: now - 2000,
      }

      const message2: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-2",
        userName: "User Two",
        timestamp: now,
      }

      const message3: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-3",
        userName: "User Three",
        timestamp: now - 1000,
      }

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: message1,
        })
        rerender()
      })

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: message2,
        })
        rerender()
      })

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: message3,
        })
        rerender()
      })

      expect(result.current.users).toEqual([
        { userId: "user-2", userName: "User Two" },
        { userId: "user-3", userName: "User Three" },
        { userId: "user-1", userName: "User One" },
      ])
    })

    it("should limit users to 50", () => {
      const { result, rerender } = renderHook(() =>
        usePresenceList(userId, userName)
      )

      const now = Date.now()

      for (let i = 0; i < 60; i++) {
        const message: PresenceMessage = {
          messageType: "presence",
          type: "join",
          userId: `user-${i}`,
          userName: `User ${i}`,
          timestamp: now + i,
        }

        act(() => {
          ;(usePresenceMessages as jest.Mock).mockReturnValue({
            lastMessage: message,
          })
          rerender()
        })
      }

      expect(result.current.users).toHaveLength(50)
      // Most recent user should be first
      expect(result.current.users[0].userId).toBe("user-59")
    })
  })

  describe("TTL pruning", () => {
    it("should not include users older than 90 seconds", () => {
      const { result, rerender } = renderHook(() =>
        usePresenceList(userId, userName)
      )

      const now = Date.now()

      const oldMessage: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "old-user",
        userName: "Old User",
        timestamp: now - 91000, // 91 seconds ago
      }

      const newMessage: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "new-user",
        userName: "New User",
        timestamp: now,
      }

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: oldMessage,
        })
        rerender()
      })

      act(() => {
        ;(usePresenceMessages as jest.Mock).mockReturnValue({
          lastMessage: newMessage,
        })
        rerender()
      })

      // Old user should be pruned
      expect(result.current.users).toEqual([
        { userId: "new-user", userName: "New User" },
      ])
    })
  })
})
