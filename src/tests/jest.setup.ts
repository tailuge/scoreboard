import "@testing-library/jest-dom"

jest.mock("@vercel/kv", () => ({
  kv: {
    hgetall: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn(),
    zrem: jest.fn(),
    flushall: jest.fn(),
  },
}))

jest.mock("uncrypto", () => ({
  randomUUID: () => "test-uuid-1234",
}))
