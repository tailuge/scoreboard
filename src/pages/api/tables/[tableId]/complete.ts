import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"

const tableService = new TableService()

/**
 * @swagger
 * /api/tables/{tableId}/complete:
 *   put:
 *     summary: Marks a specific table as complete
 *     parameters:
 *       - in: path
 *         name: tableId
 *         required: true
 *         schema:
 *           type: string
 *         description: The table ID
 *     responses:
 *       200:
 *         description: Table marked as complete
 *       400:
 *         description: Error completing the table
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tableId } = req.query

  if (req.method === "PUT") {
    try {
      const table = await tableService.completeTable(tableId as string)
      res.status(200).json(table)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  } else if (req.method === "OPTIONS") {
    res.status(200).end()
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
}
