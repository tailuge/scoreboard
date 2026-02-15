import { withSwagger } from "next-swagger-doc"
import { swaggerConfig } from "@/lib/swagger"
import { NextApiRequest, NextApiResponse } from "next"

const swaggerHandler = withSwagger(swaggerConfig)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === "production") {
    res.status(404).end()
    return
  }
  return swaggerHandler()(req, res)
}
