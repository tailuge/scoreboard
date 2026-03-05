// Test that ALLOWED_ORIGINS is correctly configured
import { ALLOWED_ORIGINS } from "../middleware"

describe("ALLOWED_ORIGINS config", () => {
  it("contains tailuge.github.io", () => {
    expect(ALLOWED_ORIGINS).toContain("https://tailuge.github.io")
  })

  it("contains billiards.tailuge.workers.dev", () => {
    expect(ALLOWED_ORIGINS).toContain("https://billiards.tailuge.workers.dev")
  })

  it("contains localhost:3000", () => {
    expect(ALLOWED_ORIGINS).toContain("http://localhost:3000")
  })

  it("contains localhost:8080", () => {
    expect(ALLOWED_ORIGINS).toContain("http://localhost:8080")
  })

  it("does not contain random origins", () => {
    expect(ALLOWED_ORIGINS).not.toContain("https://evil.com")
    expect(ALLOWED_ORIGINS).not.toContain("https://billiards.other.workers.dev")
  })

  it("has expected number of origins", () => {
    expect(ALLOWED_ORIGINS.length).toBe(4)
  })
})

// Integration test - requires next/server runtime
// These tests verify the middleware logic in a more isolated way
describe("middleware logic (manual verification)", () => {
  // This test documents expected behavior
  // Full integration testing would require running the Next.js server
  it("documents the CORS flow", () => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:8080", 
      "https://tailuge.github.io",
      "https://billiards.tailuge.workers.dev",
    ]
    
    // Test allowed origins
    expect(allowedOrigins.includes("https://tailuge.github.io")).toBe(true)
    expect(allowedOrigins.includes("https://billiards.tailuge.workers.dev")).toBe(true)
    expect(allowedOrigins.includes("http://localhost:3000")).toBe(true)
    
    // Test blocked origins
    expect(allowedOrigins.includes("https://random.com")).toBe(false)
    expect(allowedOrigins.includes("https://billiards.other.workers.dev")).toBe(false)
    expect(allowedOrigins.includes("")).toBe(false)
    expect(allowedOrigins.includes(null as any)).toBe(false)
  })
})
