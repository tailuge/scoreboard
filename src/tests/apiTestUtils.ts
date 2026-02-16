import { mock, MockProxy } from "jest-mock-extended"
import { NextApiRequest, NextApiResponse } from "next"

export function createMockRequestResponse() {
  const req = mock<NextApiRequest>()
  const res = mock<NextApiResponse>()
  res.status.mockReturnThis()
  res.json.mockReturnThis()
  return { req, res }
}
