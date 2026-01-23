import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { markUsageFromServer } from "@/utils/usage"
import { logger } from "@/utils/logger"

const tableService = new TableService()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const tables = await tableService.getTables()
    res.status(200).json(tables)
  } else if (req.method === "POST") {
    logger.log("Create table request")
    const { userId, userName, ruleType } = req.body
    const newTable = await tableService.createTable(userId, userName, ruleType)
    markUsageFromServer("createTable")
    res.status(201).json(newTable)
  }
}
