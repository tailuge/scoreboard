import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:8080",
  "https://tailuge.github.io",
  "https://billiards.tailuge.workers.dev",
])

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin")

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return new NextResponse(null, { status: 403 })
  }

  const response = NextResponse.next()
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

  return response
}

export const config = {
  matcher: "/api/:path*",
}
