import "@testing-library/jest-dom"

import { mockKv } from "./mockkv"

jest.mock("@vercel/kv", () => ({
  kv: mockKv,
}))

jest.mock("uncrypto", () => ({
  randomUUID: () => "test-uuid-1234",
}))

// Mocking Edge runtime globals
// Using a function instead of a class to avoid "class with only a constructor" error
globalThis.Request ??= function Request(input, init) {
  // Basic mock properties
  ;(this as any).url = input
  ;(this as any).method = init?.method || "GET"
  ;(this as any).headers = new (globalThis.Headers as any)(init?.headers)
  ;(this as any).body = init?.body
} as any

globalThis.Response ??= class Response {
  constructor(body, init) {
    // Basic mock properties
    ;(this as any).body = body
    ;(this as any).status = init?.status || 200
    ;(this as any).statusText = init?.statusText || "OK"
    ;(this as any).headers = new (globalThis.Headers as any)(init?.headers)
  }

  static json(data, init) {
    const body = JSON.stringify(data)
    const headers = new (globalThis.Headers as any)(init?.headers)
    headers.set("content-type", "application/json")
    return new (globalThis.Response as any)(body, { ...init, headers })
  }
} as any

globalThis.Headers ??= class Headers {
  constructor(init) {
    ;(this as any)._headers = new Map(Object.entries(init || {}))
  }
  get(name) {
    return (this as any)._headers.get(name.toLowerCase())
  }
  set(name, value) {
    ;(this as any)._headers.set(name.toLowerCase(), value)
  }
  has(name) {
    return (this as any)._headers.has(name.toLowerCase())
  }
  forEach(callback, thisArg) {
    for (const [key, value] of (this as any)._headers.entries()) {
      callback.call(thisArg, value, key, this)
    }
  }
} as any
