import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8080",
  "https://tailuge.github.io",
  "https://billiards.tailuge.workers.dev",
  "https://scoreboard-tailuge.vercel.app",
])

function withCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  )
  response.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  )
  response.headers.set("Vary", "Origin")

  return response
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin")

  // Same-origin and non-browser requests often have no Origin header.
  if (!origin) {
    return NextResponse.next()
  }

  if (!ALLOWED_ORIGINS.has(origin)) {
    return new NextResponse(null, { status: 403 })
  }

  if (request.method === "OPTIONS") {
    return withCorsHeaders(new NextResponse(null, { status: 204 }), origin)
  }

  return withCorsHeaders(NextResponse.next(), origin)
}

export const config = {
  matcher: "/api/:path*",
}
