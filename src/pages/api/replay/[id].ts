import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { Shortener } from "@/services/shortener"

export const config = {
  runtime: "edge",
}

const shortener = new Shortener(kv)

export default async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get("id")
  if (!id) {
    return new Response("Missing id parameter", { status: 400 })
  }
  const url = await shortener.replay(id)
  console.log(`redirecting to ${url}`)
  return Response.redirect(url)
}
