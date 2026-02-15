import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { markUsageFromServer } from "@/utils/usage"
import { handlePut } from "@/utils/api"

const tableService = new TableService()

/**
 * @swagger
 * /api/tables/{tableId}/join:
 *   put:
 *     summary: Joins a specific table
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
 *               - userName
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully joined the table
 *       400:
 *         description: Error joining the table
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tableId } = req.query

  return handlePut(req, res, async () => {
    const { userId, userName } = req.body
    const table = await tableService.joinTable(
      tableId as string,
      userId,
      userName
    )
    markUsageFromServer("joinTable")
    return table
  })
}
