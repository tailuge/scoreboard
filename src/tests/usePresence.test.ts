import { renderHook, act, waitFor } from "@testing-library/react"
import { usePresence } from "../components/hooks/usePresence"
import { usePresenceMessages } from "@/contexts/LobbyContext"
import { NchanPub } from "@/nchan/nchanpub"
import type { PresenceMessage } from "@/nchan/types"

jest.mock("@/contexts/LobbyContext", () => ({
    usePresenceMessages: jest.fn(),
}))

jest.mock("@/nchan/nchanpub", () => ({
    NchanPub: jest.fn(),
}))

describe("usePresence", () => {
    const userId = "user-1"
    const userName = "User One"
    const statusPage = "/api/status"
    let mockPublishPresence: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        globalThis.fetch = jest.fn() as jest.Mock

        mockPublishPresence = jest.fn().mockResolvedValue({})
            ; (NchanPub as jest.Mock).mockImplementation(() => ({
                publishPresence: mockPublishPresence,
            }))
            ; (usePresenceMessages as jest.Mock).mockReturnValue({ lastMessage: null })
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe("server status", () => {
        it("should handle successful status check", async () => {
            ; (globalThis.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                type: "basic",
            })

            const { result } = renderHook(() => usePresence(userId, userName, statusPage))

            expect(result.current.isConnecting).toBe(true)

            await waitFor(() => expect(result.current.isConnecting).toBe(false))
            expect(result.current.isOnline).toBe(true)
            expect(result.current.serverStatus).toBe("Server OK")
        })

        it("should handle failed status check", async () => {
            ; (globalThis.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
            })

            const { result } = renderHook(() => usePresence(userId, userName, statusPage))

            await waitFor(() => expect(result.current.isConnecting).toBe(false))
            expect(result.current.isOnline).toBe(false)
            expect(result.current.serverStatus).toContain("Server Issue: 500")
        })
    })

    describe("presence list and heartbeat", () => {
        it("should publish join on mount and heartbeat periodically", async () => {
            ; (globalThis.fetch as jest.Mock).mockResolvedValue({ ok: true })

            renderHook(() => usePresence(userId, userName, statusPage))

            expect(mockPublishPresence).toHaveBeenCalledWith(
                expect.objectContaining({ type: "join", userId, userName })
            )

            act(() => {
                jest.advanceTimersByTime(60000)
            })

            expect(mockPublishPresence).toHaveBeenCalledWith(
                expect.objectContaining({ type: "heartbeat", userId, userName })
            )
        })

        it("should update users list when messages arrive", () => {
            const { result, rerender } = renderHook(() =>
                usePresence(userId, userName, statusPage)
            )

            const joinMessage: PresenceMessage = {
                messageType: "presence",
                type: "join",
                userId: "user-2",
                userName: "User Two",
                timestamp: Date.now(),
            }

            act(() => {
                ; (usePresenceMessages as jest.Mock).mockReturnValue({
                    lastMessage: joinMessage,
                })
                rerender()
            })

            expect(result.current.users).toEqual([
                { userId: "user-2", userName: "User Two" },
            ])
            expect(result.current.totalUsers).toBe(1)
        })

        it("should remove user on leave message", () => {
            const { result, rerender } = renderHook(() =>
                usePresence(userId, userName, statusPage)
            )

            const joinMessage: PresenceMessage = {
                messageType: "presence",
                type: "join",
                userId: "user-2",
                userName: "User Two",
                timestamp: Date.now(),
            }

            act(() => {
                ; (usePresenceMessages as jest.Mock).mockReturnValue({
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
                timestamp: Date.now(),
            }

            act(() => {
                ; (usePresenceMessages as jest.Mock).mockReturnValue({
                    lastMessage: leaveMessage,
                })
                rerender()
            })

            expect(result.current.users).toHaveLength(0)
        })
    })
})
