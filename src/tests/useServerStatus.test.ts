import { renderHook, waitFor } from "@testing-library/react"
import { useServerStatus } from "../components/hooks/useServerStatus"
describe("useServerStatus", () => {
  const mockStatusPage = "http://localhost:3000/status"

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn() as jest.Mock
  })

  it("should have the correct initial state", async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })
    const { result } = renderHook(() => useServerStatus(mockStatusPage))
    expect(result.current.isConnecting).toBe(true)
    expect(result.current.isOnline).toBe(false)
    expect(result.current.serverStatus).toBe(null)

    await waitFor(() => expect(result.current.isConnecting).toBe(false))
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

    const { result } = renderHook(() => useServerStatus(mockStatusPage))

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false)
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.serverStatus).toBe("Server OK")
  })

  it("should handle a failed server connection", async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    })

    const { result } = renderHook(() => useServerStatus(mockStatusPage))

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.serverStatus).toBe(
        "Server Issue: 500 Internal Server Error"
      )
    })

    expect(result.current.isOnline).toBe(false)
  })

  it("should handle a network error", async () => {
    const errorMessage = "Network error"
    ;(globalThis.fetch as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    )

    const { result } = renderHook(() => useServerStatus(mockStatusPage))

    await waitFor(() => {
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.serverStatus).toBe(`Server Down: ${errorMessage}`)
    })

    expect(result.current.isOnline).toBe(false)
  })
})
