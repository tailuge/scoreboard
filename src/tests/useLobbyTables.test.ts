import { renderHook, act, waitFor } from "@testing-library/react"
import { useLobbyTables } from "../components/hooks/useLobbyTables"
import { mockTable, mockTables } from "./mockData"

describe("useLobbyTables", () => {
  const userId = "user-1"
  const userName = "User One"

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn()
  })

  it("should fetch tables on mount", async () => {
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
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTable),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
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
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTable),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
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
        body: JSON.stringify({ userId, userName, ruleType: "nineball" }),
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
})
