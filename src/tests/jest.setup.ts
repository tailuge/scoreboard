import "@testing-library/jest-dom"

import { mockKv } from "./mockkv"
import { logger } from "../utils/logger"

logger.enabled = false

jest.mock("@vercel/kv", () => ({
  kv: mockKv,
}))

jest.mock("uncrypto", () => ({
  randomUUID: () => "test-uuid-1234",
}))

// Mocking Edge runtime globals
// Using a function instead of a class to avoid "class with only a constructor" error
globalThis.Request ??= function Request(
  this: any,
  input: any,
  init?: { method?: string; headers?: any; body?: any }
) {
  // Basic mock properties
  this.url = input
  this.method = init?.method || "GET"
  this.headers = new (globalThis.Headers as any)(init?.headers)
  this.body = init?.body
} as any

globalThis.Response ??= class Response {
  body: any
  status: number
  statusText: string
  headers: Headers

  constructor(
    body: any,
    init?: { status?: number; statusText?: string; headers?: any }
  ) {
    this.body = body
    this.status = init?.status || 200
    this.statusText = init?.statusText || "OK"
    this.headers = new (globalThis.Headers as any)(init?.headers)
  }

  async json() {
    return JSON.parse(this.body)
  }

  async text() {
    return this.body
  }

  static json(data: any, init?: any) {
    const body = JSON.stringify(data)
    const headers = new (globalThis.Headers as any)(init?.headers)
    headers.set("content-type", "application/json")
    return new (globalThis.Response as any)(body, { ...init, headers })
  }
} as any

globalThis.Headers ??= class Headers {
  _headers: Map<string, any>

  constructor(init?: any) {
    this._headers = new Map(Object.entries(init || {}))
  }
  get(name: string) {
    return this._headers.get(name.toLowerCase())
  }
  set(name: string, value: any) {
    this._headers.set(name.toLowerCase(), value)
  }
  has(name: string) {
    return this._headers.has(name.toLowerCase())
  }
  forEach(
    callback: (value: any, key: string, parent: this) => void,
    thisArg?: any
  ) {
    for (const [key, value] of this._headers.entries()) {
      callback.call(thisArg, value, key, this)
    }
  }
} as any

jest.mock("next/font/google", () => ({
  Exo: jest.fn(() => ({
    variable: "--font-exo",
    className: "exo-font",
  })),
  Bitcount_Prop_Double: jest.fn(() => ({
    variable: "--font-bitcount",
    className: "bitcount-font",
  })),
}))
