import React from "react"
import { render, waitFor, screen } from "@testing-library/react"
import Lobby from "../pages/lobby"
import { useSearchParams } from "next/navigation"

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useSearchParams: jest.fn(),
}))

// Mock markUsage
jest.mock("@/utils/usage", () => ({
    markUsage: jest.fn(),
}))

// Mock nchan
jest.mock("@/nchan/nchansub", () => ({
    NchanSub: jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
    })),
}))

jest.mock("@/nchan/nchanpub", () => ({
    NchanPub: jest.fn().mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(5),
    })),
}))

const mockFetchActiveUsers = jest.fn()

// Mock useServerStatus hook
jest.mock("@/components/hooks/useServerStatus", () => ({
    useServerStatus: () => ({
        isOnline: true,
        serverStatus: "Server OK",
        isConnecting: false,
        activeUsers: 5,
        fetchActiveUsers: mockFetchActiveUsers,
    }),
}))

describe("Lobby Redirection Tests", () => {
    const mockTables = [
        {
            id: "table-1",
            creator: { id: "creator-1", name: "Creator 1" },
            players: [{ id: "creator-1", name: "Creator 1" }],
            spectators: [],
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
            isActive: true,
            ruleType: "nineball",
            completed: false,
        },
    ]

    beforeEach(() => {
        jest.clearAllMocks()

            // Default search params mock (can be overridden in tests)
            ; (useSearchParams as jest.Mock).mockReturnValue({
                get: (key: string) => {
                    if (key === "username") return "TestUser"
                    if (key === "action") return "join"
                    if (key === "gameType") return "nineball"
                    return null
                },
            })

        // Mock globalThis fetch
        globalThis.fetch = jest.fn().mockImplementation((url) => {
            if (url === "/api/tables") {
                return Promise.resolve({
                    json: () => Promise.resolve(mockTables),
                    ok: true,
                })
            }
            if (url.includes("/join")) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({}),
                })
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            })
        })
    })

    it("should attempt to join table and show PlayModal when redirecting with action=join", async () => {
        // Override search params for this specific test if needed, 
        // but the beforeEach defaults are set for this scenario.

        render(<Lobby />)

        // Check if fetch was called with PUT to join endpoint automatically
        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringMatching(/\/api\/tables\/table-1\/join/),
                expect.objectContaining({
                    method: "PUT",
                })
            )
        })

        // Expect the PlayModal to appear. 
        // This expects the BUG to be present initially (test should fails or we assert it doesn't happen if we want to confirm failure explicitly, 
        // but usually we write the test for the desired behavior and watch it fail).
        // The previous tests suggest "Opponent Ready" is the text in PlayModal.
        await waitFor(() => {
            expect(screen.getByText("Opponent Ready")).toBeInTheDocument()
        })
    })
})
