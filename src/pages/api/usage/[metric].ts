import { NextRequest, NextFetchEvent } from "next/server"
import { UsageService } from "@/services/usageservice"
import { logger } from "@/utils/logger"
import { corsResponse, corsJson } from "@/utils/cors"

export const config = {
  runtime: "edge",
}

export default async function handler(
  request: NextRequest,
  event?: NextFetchEvent
) {
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
    const promise = usageService.incrementCount(Date.now()).catch((err) => {
      logger.error("Failed to increment usage count:", err)
    })

    if (event && typeof event.waitUntil === "function") {
      event.waitUntil(promise)
      return corsResponse(null, { status: 202 })
    }

    await promise
  }

  return corsResponse(null, { status: 200 })
}
