import { NchanSub } from "../../nchan/nchansub"
import { logger } from "../../utils/logger"
import { MockWebSocket, setupWebSocketMock } from "./nchanTestUtils"

describe("NchanSub bfcache", () => {
  let cleanupWebSocketMock: () => void

  beforeAll(() => {
    cleanupWebSocketMock = setupWebSocketMock()
  })

  afterAll(() => {
    cleanupWebSocketMock()
  })

  let sub: NchanSub
  const channel = "test-channel"
  const notifyMock = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()
    sub = new NchanSub(channel, notifyMock)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
    sub.stop()
  })

  it("should close connection on pagehide", () => {
    sub.start()
    const mockSocket = sub["socket"] as unknown as MockWebSocket
    const logSpy = jest.spyOn(logger, "log")

    // Dispatch pagehide event
    window.dispatchEvent(new Event("pagehide"))

    expect(mockSocket.close).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Closed connection for bfcache"))
    expect(sub["isPageHidden"]).toBe(true)
  })

  it("should not reconnect while page is hidden", () => {
    sub.start()
    const mockSocket = sub["socket"] as unknown as MockWebSocket

    // Page hide
    window.dispatchEvent(new Event("pagehide"))

    // Simulate close event that might happen after pagehide
    mockSocket.onclose({ reason: "away" } as CloseEvent)

    const connectSpy = jest.spyOn(sub as any, "connect")

    // Advance timers
    jest.advanceTimersByTime(30000)

    expect(connectSpy).not.toHaveBeenCalled()
  })

  it("should restore connection on pageshow if persisted", () => {
    const connectSpy = jest.spyOn(NchanSub.prototype as any, "connect")
    sub.start()

    // Page hide
    window.dispatchEvent(new Event("pagehide"))

    // Page show with persisted = true
    const pageShowEvent = new Event("pageshow") as any
    pageShowEvent.persisted = true
    window.dispatchEvent(pageShowEvent)

    expect(sub["isPageHidden"]).toBe(false)
    // One for initial start, one for pageshow restore
    expect(connectSpy).toHaveBeenCalledTimes(2)
    connectSpy.mockRestore()
  })

  it("should not restore connection on pageshow if NOT persisted", () => {
    const connectSpy = jest.spyOn(NchanSub.prototype as any, "connect")
    sub.start()

    // Page hide
    window.dispatchEvent(new Event("pagehide"))

    // Page show with persisted = false
    const pageShowEvent = new Event("pageshow") as any
    pageShowEvent.persisted = false
    window.dispatchEvent(pageShowEvent)

    expect(sub["isPageHidden"]).toBe(false)
    // Only the initial start call
    expect(connectSpy).toHaveBeenCalledTimes(1)
    connectSpy.mockRestore()
  })
})
