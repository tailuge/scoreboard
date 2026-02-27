// Mock WebSocket class for testing nchan subscriptions
export class MockWebSocket {
  onopen: () => void = () => {}
  onmessage: (event: MessageEvent) => void = () => {}
  onerror: (error: Event) => void = () => {}
  onclose: (event: CloseEvent) => void = () => {}
  readyState = 1
  protocol = ""
  extensions = ""
  close = jest.fn()
  send = jest.fn()

  constructor(public url: string) {}
}

export function setupWebSocketMock() {
  const originalWebSocket = globalThis.WebSocket
  globalThis.WebSocket = MockWebSocket as any
  return () => {
    globalThis.WebSocket = originalWebSocket
  }
}
