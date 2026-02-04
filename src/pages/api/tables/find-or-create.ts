import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { markUsageFromServer } from "@/utils/usage"
import { logger } from "@/utils/logger"

const tableService = new TableService()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    logger.log("Find or create table request")
    const { userId, userName, gameType } = req.body

    if (!userId || !userName || !gameType) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    try {
      const table = await tableService.findOrCreate(userId, userName, gameType)
      markUsageFromServer("findOrCreateTable")
      res.status(200).json(table)
    } catch (error) {
      logger.error("Error in find-or-create:", error)
      res.status(500).json({ error: "Internal Server Error" })
    }
  } else if (req.method === "OPTIONS") {
    res.status(200).end()
  } else {
    res.setHeader("Allow", ["POST", "OPTIONS"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
