import { NextRequest } from "next/server"
import { UsageService } from "@/services/usageservice"
import { logger } from "@/utils/logger"
import { corsResponse, corsJson } from "@/utils/cors"

export const config = {
  runtime: "edge",
}

export default async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const metric = searchParams.get("metric")

  if (!metric) {
    return corsResponse("Metric is required", { status: 400 })
  }

  let usageService: UsageService
  try {
    usageService = new UsageService(metric)
  } catch (error) {
    logger.warn("Error creating UsageService:", error)
    return corsResponse("Invalid metric name", { status: 400 })
  }

  if (request.method === "GET") {
    return corsJson(await usageService.getAllCounts())
  }

  if (request.method === "PUT") {
    await usageService.incrementCount(Date.now())
  }

  return corsResponse(null, { status: 200 })
}
