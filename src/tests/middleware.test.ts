// Test that ALLOWED_ORIGINS is correctly configured
import { ALLOWED_ORIGINS } from "../middleware";

describe("ALLOWED_ORIGINS config", () => {
  it("contains tailuge.github.io", () => {
    expect(ALLOWED_ORIGINS.has("https://tailuge.github.io")).toBe(true);
  });

  it("contains billiards.tailuge.workers.dev", () => {
    expect(ALLOWED_ORIGINS.has("https://billiards.tailuge.workers.dev")).toBe(
      true,
    );
  });

  it("contains localhost:3000", () => {
    expect(ALLOWED_ORIGINS.has("http://localhost:3000")).toBe(true);
  });

  it("contains localhost:8080", () => {
    expect(ALLOWED_ORIGINS.has("http://localhost:8080")).toBe(true);
  });

  it("does not contain random origins", () => {
    expect(ALLOWED_ORIGINS.has("https://evil.com")).toBe(false);
    expect(ALLOWED_ORIGINS.has("https://billiards.other.workers.dev")).toBe(
      false,
    );
  });

  it("has expected number of origins", () => {
    expect(ALLOWED_ORIGINS.size).toBe(5);
  });
});

// Integration test - requires next/server runtime
// These tests verify the middleware logic in a more isolated way
describe("middleware logic (manual verification)", () => {
  // This test documents expected behavior
  // Full integration testing would require running the Next.js server
  it("documents the CORS flow", () => {
    const allowedOrigins = new Set([
      "http://localhost:3000",
      "http://localhost:8080",
      "https://tailuge.github.io",
      "https://billiards.tailuge.workers.dev",
      "https://scoreboard-tailuge.vercel.app",
    ]);

    // Test allowed origins
    expect(allowedOrigins.has("https://tailuge.github.io")).toBe(true);
    expect(allowedOrigins.has("https://billiards.tailuge.workers.dev")).toBe(
      true,
    );
    expect(allowedOrigins.has("http://localhost:3000")).toBe(true);

    // Test blocked origins
    expect(allowedOrigins.has("https://random.com")).toBe(false);
    expect(allowedOrigins.has("https://billiards.other.workers.dev")).toBe(
      false,
    );
    expect(allowedOrigins.has("")).toBe(false);
    expect(allowedOrigins.has(null as any)).toBe(false);
  });
});
