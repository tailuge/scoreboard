import { NextRequest } from "next/server"
import { UsageService } from "@/services/usageservice"

export const config = {
  runtime: "edge",
}

export default async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const metric = searchParams.get("metric")

  if (!metric) {
    return new Response("Missing metric parameter", { status: 400 })
  }

  const usageService = new UsageService(metric)

  if (request.method === "GET") {
    return Response.json(await usageService.getAllCounts())
  }

  if (request.method === "PUT") {
    await usageService.incrementCount(Date.now())
  }

  return new Response(null, { status: 200 })
}
