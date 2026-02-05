import { renderHook, act, waitFor } from "@testing-library/react"
import { useLobbyTables } from "../components/hooks/useLobbyTables"
import { useLobbyContext } from "@/contexts/LobbyContext"

jest.mock("@/contexts/LobbyContext", () => ({
  useLobbyContext: jest.fn(),
}))

describe("useLobbyTables", () => {
  const userId = "user-1"
  const userName = "User One"

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn()
    ;(useLobbyContext as jest.Mock).mockReturnValue({ lastMessage: null })
  })

  it("should fetch tables on mount", async () => {
    const mockTables = [{ id: "t1", ruleType: "nineball" }]
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTables),
    })

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.tables).toEqual(mockTables)
    })

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/tables")
  })

  it("should handle fetch error", async () => {
    ;(globalThis.fetch as jest.Mock).mockRejectedValue(
      new Error("Fetch failed")
    )
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.tables).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("should perform table join action", async () => {
    const mockTable = { id: "t1", ruleType: "nineball" }
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTable),
      })

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let updatedTable
    await act(async () => {
      updatedTable = await result.current.tableAction("t1", "join")
    })

    expect(updatedTable).toEqual(mockTable)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/tables/t1/join",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ userId, userName }),
      })
    )
  })

  it("should perform findOrCreateTable action", async () => {
    const mockTable = { id: "t1", ruleType: "nineball" }
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTable),
      })

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let table
    await act(async () => {
      table = await result.current.findOrCreateTable("nineball")
    })

    expect(table).toEqual(mockTable)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/tables/find-or-create",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userId, userName, gameType: "nineball" }),
      })
    )
  })

  it("should return null if findOrCreateTable fails", async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
      })
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let table
    await act(async () => {
      table = await result.current.findOrCreateTable("nineball")
    })

    expect(table).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("should perform createTable action", async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
      })

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success
    await act(async () => {
      success = await result.current.createTable("snooker")
    })

    expect(success).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/tables",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userId, userName, ruleType: "snooker" }),
      })
    )
  })

  it("should return false if createTable fails", async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
      })
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success
    await act(async () => {
      success = await result.current.createTable("snooker")
    })

    expect(success).toBe(false)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("should return null if tableAction fails", async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
      })

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let updatedTable
    await act(async () => {
      updatedTable = await result.current.tableAction("t1", "join")
    })

    expect(updatedTable).toBeNull()
  })

  it("should return null if tableAction throws", async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockRejectedValueOnce(new Error("Network error"))
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    const { result } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let updatedTable
    await act(async () => {
      updatedTable = await result.current.tableAction("t1", "join")
    })

    expect(updatedTable).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("should refetch tables on message", async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const { rerender } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))
    ;(useLobbyContext as jest.Mock).mockReturnValue({
      lastMessage: { action: "create" },
    })

    rerender()

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2))
  })

  it("should not refetch tables when action is 'connected'", async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const { rerender } = renderHook(() => useLobbyTables(userId, userName))

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1))
    ;(useLobbyContext as jest.Mock).mockReturnValue({
      lastMessage: { action: "connected" },
    })

    rerender()

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
})
