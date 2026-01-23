import { Shortener } from "@/services/shortener"
import { NextRequest } from "next/server"
import { logger } from "@/utils/logger"
import { kv } from "@vercel/kv"

export const config = {
  runtime: "edge",
}

export default async function handler(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return new Response("ID is required", { status: 400 })
  }
  const url = await new Shortener(kv).replay(id)
  logger.log(`redirecting to ${url}`)
  return Response.redirect(url)
}
