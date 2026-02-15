import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { handlePut } from "@/utils/api"

const tableService = new TableService()

/**
 * @swagger
 * /api/tables/{tableId}/spectate:
 *   put:
 *     summary: Spectates a specific table
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
 *         description: Successfully started spectating
 *       400:
 *         description: Error spectating the table
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tableId } = req.query

  return handlePut(req, res, async () => {
    const { userId, userName } = req.body
    return await tableService.spectateTable(tableId as string, userId, userName)
  })
}
