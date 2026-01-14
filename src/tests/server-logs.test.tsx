import React from "react"
import { render } from "@testing-library/react"
import { screen, waitFor } from "@testing-library/dom"
import ServerLogs from "../pages/server-logs"

describe("ServerLogs Page", () => {
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

        // Mock globalThis fetch
        globalThis.fetch = jest.fn().mockImplementation((url) => {
            if (url === "/api/tables") {
                return Promise.resolve({
                    json: () => Promise.resolve(mockTables),
                    ok: true,
                })
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({}),
            })
        })
    })

    it("should render active tables", async () => {
        render(<ServerLogs />)

        // Check if the title is rendered
        expect(screen.getByRole("heading", { name: /Active Tables/i })).toBeInTheDocument()

        // Wait for tables to load and display
        await waitFor(() => {
            expect(screen.getByText(/table-1/)).toBeInTheDocument()
            expect(screen.getByText(/Creator 1/)).toBeInTheDocument()
        })
    })

    it("should show a message when no tables are found", async () => {
        globalThis.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve([]),
                ok: true,
            })
        )

        render(<ServerLogs />)

        await waitFor(() => {
            expect(screen.getByText(/No active tables found/i)).toBeInTheDocument()
        })
    })

    it("should handle fetch errors gracefully", async () => {
        globalThis.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
                text: () => Promise.resolve("<!DOCTYPE html><html>...</html>"),
            })
        )

        render(<ServerLogs />)

        await waitFor(() => {
            expect(screen.getByText(/Error fetching tables/i)).toBeInTheDocument()
        })
    })
})
