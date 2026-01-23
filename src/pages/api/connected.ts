import type { NextRequest } from "next/server"
import { NchanPub } from "@/nchan/nchanpub"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

export default async function handler(req: NextRequest) {
  if (req.method === "GET") {
    logger.log(`connected`)
    await new NchanPub("lobby").post({ action: "connected" })
    return Response.json({ success: true })
  }
}
