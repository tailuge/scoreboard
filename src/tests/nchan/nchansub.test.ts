import { NchanSub } from "../../nchan/nchansub"
import { logger } from "../../utils/logger"
import { MockWebSocket, setupWebSocketMock } from "./nchanTestUtils"

describe("NchanSub", () => {
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

  it("should construct with correct subscribeUrl", () => {
    expect(sub["subscribeUrl"]).toContain(
      `billiards-network.onrender.com/subscribe/lobby/${channel}`
    )
  })

  it("start should create a WebSocket connection", () => {
    sub.start()
    expect(sub["socket"]).toBeInstanceOf(MockWebSocket)
  })

  it("should handle incoming messages", () => {
    const logSpy = jest.spyOn(logger, "log")
    sub.start()
    const mockSocket = sub["socket"] as unknown as MockWebSocket
    const messageEvent = { data: "test-message" } as MessageEvent

    mockSocket.onmessage(messageEvent)

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{2}:\d{2}:\d{2} <- test-message$/)
    )
    expect(notifyMock).toHaveBeenCalledWith("test-message")
  })

  it("should silently ignore empty messages", () => {
    const logSpy = jest.spyOn(logger, "log")
    sub.start()
    const mockSocket = sub["socket"] as unknown as MockWebSocket
    mockSocket.onmessage({ data: "", origin: "" } as MessageEvent)

    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("<empty message>")
    )
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it("should reconnect after timeout", () => {
    const connectSpy = jest.spyOn(sub as any, "connect")
    sub.start()
    expect(connectSpy).toHaveBeenCalledTimes(1)

    const mockSocket = sub["socket"] as unknown as MockWebSocket
    mockSocket.onclose({ reason: "test" } as CloseEvent)

    expect(connectSpy).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(30000)
    expect(connectSpy).toHaveBeenCalledTimes(2)
  })

  it("stop should clear reconnect timeout and close socket", () => {
    sub.start()
    const mockSocket = sub["socket"] as unknown as MockWebSocket

    sub.stop()

    expect(mockSocket.close).toHaveBeenCalled()
    expect(sub["socket"]).toBeNull()
  })

  describe("bfcache support", () => {
    it("should close connection on pagehide", () => {
      sub.start()
      const mockSocket = sub["socket"] as unknown as MockWebSocket
      const logSpy = jest.spyOn(logger, "log")

      globalThis.dispatchEvent(new Event("pagehide"))

      expect(mockSocket.close).toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Closed connection for bfcache"))
      expect(sub["isPageHidden"]).toBe(true)
    })

    it("should not reconnect while page is hidden", () => {
      sub.start()
      const mockSocket = sub["socket"] as unknown as MockWebSocket

      globalThis.dispatchEvent(new Event("pagehide"))
      mockSocket.onclose({ reason: "away" } as CloseEvent)

      const connectSpy = jest.spyOn(sub as any, "connect")
      jest.advanceTimersByTime(30000)

      expect(connectSpy).not.toHaveBeenCalled()
    })

    it("should restore connection on pageshow if persisted", () => {
      const connectSpy = jest.spyOn(NchanSub.prototype as any, "connect")
      sub.start()

      globalThis.dispatchEvent(new Event("pagehide"))

      const pageShowEvent = new Event("pageshow") as any
      pageShowEvent.persisted = true
      globalThis.dispatchEvent(pageShowEvent)

      expect(sub["isPageHidden"]).toBe(false)
      expect(connectSpy).toHaveBeenCalledTimes(2)
      connectSpy.mockRestore()
    })

    it("should not restore connection on pageshow if NOT persisted", () => {
      const connectSpy = jest.spyOn(NchanSub.prototype as any, "connect")
      sub.start()

      globalThis.dispatchEvent(new Event("pagehide"))

      const pageShowEvent = new Event("pageshow") as any
      pageShowEvent.persisted = false
      globalThis.dispatchEvent(pageShowEvent)

      expect(sub["isPageHidden"]).toBe(false)
      expect(connectSpy).toHaveBeenCalledTimes(1)
      connectSpy.mockRestore()
    })
  })
})
