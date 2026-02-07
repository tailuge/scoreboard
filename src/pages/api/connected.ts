import type { NextRequest } from "next/server"
import { NchanPub } from "@/nchan/nchanpub"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

/**
 * @swagger
 * /api/connected:
 *   get:
 *     summary: Notifies that a user has connected to the lobby
 *     responses:
 *       200:
 *         description: Successfully notified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
export default async function handler(req: NextRequest) {
  if (req.method === "GET") {
    logger.log(`connected`)
    await new NchanPub("lobby").post({ action: "connected" })
    return Response.json({ success: true })
  }
}
