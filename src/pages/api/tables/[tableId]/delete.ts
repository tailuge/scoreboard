import { NextApiRequest, NextApiResponse } from "next"
import { TableService } from "@/services/TableService"
import { logger } from "@/utils/logger"

const tableService = new TableService()

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
