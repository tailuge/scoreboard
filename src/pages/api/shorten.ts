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
    logger.log(json)
    const body = await shortener.shorten(json)
    return new Response(JSON.stringify(body))
  } catch (error) {
    return new Response("Request failed", { status: 400 })
    return new Response("Invalid JSON body", { status: 400 })
  }
}
