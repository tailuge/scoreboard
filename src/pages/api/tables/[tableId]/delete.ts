import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { logger } from "@/utils/logger"

const tableService = new TableService()

/**
 * @swagger
 * /api/tables/{tableId}/delete:
 *   post:
 *     summary: Deletes a specific table
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: string
 *         description: The table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table deleted
 *       400:
 *         description: Missing userId
 *       403:
 *         description: Unauthorized or table not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Deletes a specific table
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: string
 *         description: The table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table deleted
 *       400:
 *         description: Missing userId
 *       403:
 *         description: Unauthorized or table not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tableId } = req.query
  const { userId } = req.body

  if (req.method === "POST" || req.method === "DELETE") {
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" })
    }

    try {
      const success = await tableService.deleteTable(tableId as string, userId)
      if (success) {
        res.status(200).json({ success: true })
      } else {
        res.status(403).json({ error: "Unauthorized or table not found" })
      }
    } catch (error) {
      logger.error("Error deleting table:", error)
      res.status(500).json({ error: "Internal Server Error" })
    }
  } else if (req.method === "OPTIONS") {
    res.status(200).end()
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
}
