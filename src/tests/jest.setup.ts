import "@testing-library/jest-dom"

import { mockKv } from "./mockkv"

jest.mock("@vercel/kv", () => ({
  kv: mockKv,
}))

jest.mock("uncrypto", () => ({
  randomUUID: () => "test-uuid-1234",
}))
