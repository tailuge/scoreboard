import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

export default async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ruletype = searchParams.get("ruletype")
  const id = searchParams.get("id")

  if (!ruletype || !id) {
    return new Response("Missing ruletype or id", { status: 400 })
  }

  if (request.method === "GET") {
    const url = await scoretable.get(ruletype, id)
    console.log(`redirecting ${ruletype} id ${id} to ${url}`)
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
      },
    })
  }

  if (request.method === "PUT") {
    await scoretable.like(ruletype, id)
    console.log(`liked ${ruletype} id ${id}`)
  }

  return new Response(null, { status: 200 })
}
