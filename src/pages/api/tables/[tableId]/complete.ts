import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { handlePut } from "@/utils/api"

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

  return handlePut(req, res, async () => {
    return await tableService.completeTable(tableId as string)
  })
}
