import { NextRequest } from "next/server"
import { UsageService } from "@/services/usageservice"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

/**
 * @swagger
 * /api/usage/{metric}:
 *   get:
 *     summary: Returns usage counts for a specific metric
 *     parameters:
 *       - in: path
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *         description: The metric name
 *     responses:
 *       200:
 *         description: Usage counts
 *   put:
 *     summary: Increments the usage count for a specific metric
 *     parameters:
 *       - in: path
 *         name: metric
 *         required: true
 *         schema:
 *           type: string
 *         description: The metric name
 *     responses:
 *       200:
 *         description: Count incremented
 */
export default async function handler(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200 })
  }

  const searchParams = request.nextUrl.searchParams
  const metric = searchParams.get("metric")

  if (!metric) {
    return new Response("Metric is required", { status: 400 })
  }

  let usageService: UsageService
  try {
    usageService = new UsageService(metric)
  } catch (error) {
    logger.error("Error creating UsageService:", error)
    return new Response("Invalid metric name", { status: 400 })
  }

  if (request.method === "GET") {
    return Response.json(await usageService.getAllCounts())
  }

  if (request.method === "PUT") {
    await usageService.incrementCount(Date.now())
  }

  return new Response(null, { status: 200 })
}
