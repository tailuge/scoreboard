import { Shortener } from "@/services/shortener"
import { NextRequest } from "next/server"
import { logger } from "@/utils/logger"
import { kv } from "@vercel/kv"

export const config = {
  runtime: "edge",
}

/**
 * @swagger
 * /api/replay/{id}:
 *   get:
 *     summary: Redirects to the replay URL for a given ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The replay ID
 *     responses:
 *       302:
 *         description: Redirects to replay URL
 *       400:
 *         description: ID is required
 */
export default async function handler(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return new Response("ID is required", { status: 400 })
  }
  const url = await new Shortener(kv).replay(id)
  logger.log(`redirecting to ${url}`)
  return Response.redirect(url)
}
