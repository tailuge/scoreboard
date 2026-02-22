import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { Shortener } from "@/services/shortener"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

const shortener = new Shortener(kv)

/**
 * @swagger
 * /api/shorten:
 *   post:
 *     summary: Shortens a URL or JSON object
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Shortened data
 */
export default async function handler(request: NextRequest) {
  try {
    const json = await request.json()
    if (json === null || json === undefined) {
      return new Response("Invalid JSON body", { status: 400 })
    }
    logger.log(json)
    const body = await shortener.shorten(json)
    return new Response(JSON.stringify(body))
  } catch (error) {
    logger.error("Failed to parse shorten request:", error)
    return new Response("Invalid JSON body", { status: 400 })
  }
}
