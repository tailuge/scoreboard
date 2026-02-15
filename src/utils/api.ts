import { NextApiRequest, NextApiResponse } from "next"

export async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  action: () => Promise<any>
) {
  if (req.method === "PUT") {
    try {
      const result = await action()
      res.status(200).json(result)
    } catch (error) {
      res.status(400).json({ error: (error as Error).message })
    }
  } else if (req.method === "OPTIONS") {
    res.status(200).end()
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
}
