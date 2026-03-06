import { NextRequest, NextResponse } from "next/server";
import { proxy, ALLOWED_ORIGINS } from "../proxy";
import { GAME_BASE_URL } from "@/config";

describe("middleware logic", () => {
  const nextUrl = new URL("http://localhost:3000/api/rank");

  it("should allow same-origin requests without extra headers", () => {
    const request = new NextRequest(nextUrl, {
      headers: {
        origin: "http://localhost:3000",
      },
    });

    const response = proxy(request);
    expect(response).toBeInstanceOf(NextResponse);
    // For same-origin, proxy(request) returns NextResponse.next()
    // In this test environment, we check if it doesn't have CORS headers set by withCorsHeaders
    expect(response?.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("should allow requests from allowed origins with correct headers", () => {
    const origin = "https://tailuge.github.io";
    const request = new NextRequest(nextUrl, {
      headers: {
        origin,
      },
    });

    const response = proxy(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response?.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    );
  });

  it("should return 403 for disallowed origins", () => {
    const request = new NextRequest(nextUrl, {
      headers: {
        origin: "https://malicious.com",
      },
    });

    const response = proxy(request);
    expect(response?.status).toBe(403);
  });

  it("should return 204 for OPTIONS requests from allowed origins", () => {
    const origin = "https://tailuge.github.io";
    const request = new NextRequest(nextUrl, {
      method: "OPTIONS",
      headers: {
        origin,
      },
    });

    const response = proxy(request);
    expect(response?.status).toBe(204);
    expect(response?.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response?.headers.get("Access-Control-Allow-Methods")).toContain(
      "OPTIONS",
    );
  });

  it("should allow requests without origin header (e.g. server-to-server or direct browser)", () => {
    const request = new NextRequest(nextUrl);

    const response = proxy(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("ALLOWED_ORIGINS config", () => {
  it("contains tailuge.github.io", () => {
    expect(ALLOWED_ORIGINS.has("https://tailuge.github.io")).toBe(true);
  });

  it("contains billiards.tailuge.workers.dev", () => {
    expect(ALLOWED_ORIGINS.has(GAME_BASE_URL)).toBe(true);
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
