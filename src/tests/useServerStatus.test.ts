import { renderHook, act } from "@testing-library/react"
import { useServerStatus } from "../components/hooks/useServerStatus"
import { NchanPub } from "../nchan/nchanpub"

jest.mock("../nchan/nchanpub")

describe("useServerStatus", () => {
  const mockStatusPage = "http://localhost:3000/status"

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn() as jest.Mock
  })

  it("should have the correct initial state", async () => {
    const { result } = renderHook(() => useServerStatus(mockStatusPage))
    expect(result.current.isConnecting).toBe(true)
    expect(result.current.isOnline).toBe(false)
    expect(result.current.serverStatus).toBe(null)
    expect(result.current.activeUsers).toBe(null)
  })

  it("should handle a successful server connection", async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        type: "basic",
      })
      .mockResolvedValueOnce({
        // for registerConnected
        ok: true,
      })

    const mockGet = jest.fn().mockResolvedValue(5)
    ;(NchanPub as jest.Mock).mockImplementation(() => {
      return {
        get: mockGet,
      }
    })

    const { result, rerender } = renderHook(() =>
      useServerStatus(mockStatusPage)
    )

    await act(async () => {
      rerender()
    })

    expect(result.current.isConnecting).toBe(false)
    expect(result.current.isOnline).toBe(true)
    expect(result.current.serverStatus).toBe("Server OK")
    expect(result.current.activeUsers).toBe(5)
  })

  it("should handle a failed server connection", async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })

    const { result, rerender } = renderHook(() =>
      useServerStatus(mockStatusPage)
    )

    await act(async () => {
      rerender()
    })

    expect(result.current.isConnecting).toBe(false)
    expect(result.current.isOnline).toBe(false)
    expect(result.current.serverStatus).toBe(
      "Server Issue: 500 Internal Server Error"
    )
    expect(result.current.activeUsers).toBe(null)
  })

  it("should handle a network error", async () => {
    const errorMessage = "Network error"
    ;(globalThis.fetch as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    )

    const { result, rerender } = renderHook(() =>
      useServerStatus(mockStatusPage)
    )

    await act(async () => {
      rerender()
    })

    expect(result.current.isConnecting).toBe(false)
    expect(result.current.isOnline).toBe(false)
    expect(result.current.serverStatus).toBe(`Server Down: ${errorMessage}`)
    expect(result.current.activeUsers).toBe(null)
  })

  it("should fetch active users manually", async () => {
    ;(globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        type: "basic",
      })
      .mockResolvedValueOnce({
        ok: true,
      })

    const mockGet = jest.fn().mockResolvedValue(10)
    ;(NchanPub as jest.Mock).mockImplementation(() => {
      return {
        get: mockGet,
      }
    })

    const { result, rerender } = renderHook(() =>
      useServerStatus(mockStatusPage)
    )

    await act(async () => {
      rerender()
    })

    // initial fetch
    expect(result.current.activeUsers).toBe(10)

    // manual fetch
    mockGet.mockResolvedValue(15)
    await act(async () => {
      await result.current.fetchActiveUsers()
    })

    expect(result.current.activeUsers).toBe(15)
  })
})
