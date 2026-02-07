import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { markUsageFromServer } from "@/utils/usage"
import { logger } from "@/utils/logger"

const tableService = new TableService()

/**
 * @swagger
 * /api/tables:
 *   get:
 *     summary: Returns a list of all active tables
 *     responses:
 *       200:
 *         description: A list of tables
 *   post:
 *     summary: Creates a new table
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userName
 *               - ruleType
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               ruleType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Table created
 */
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
  } else if (req.method === "OPTIONS") {
    res.status(200).end()
  }
}
