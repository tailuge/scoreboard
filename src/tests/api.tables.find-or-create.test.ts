import handler from "@/pages/api/tables/find-or-create"
import { TableService } from "@/services/TableService"
import { markUsageFromServer } from "@/utils/usage"
import { NextApiRequest, NextApiResponse } from "next"
import { mock, MockProxy } from "jest-mock-extended"

// Mock the dependencies
jest.mock("@/services/TableService")
jest.mock("@/utils/usage", () => ({
  markUsageFromServer: jest.fn(),
}))

const mockTableService = TableService as jest.MockedClass<typeof TableService>
const mockMarkUsage = markUsageFromServer as jest.Mock

describe("/api/tables/find-or-create handler", () => {
  let req: MockProxy<NextApiRequest>
  let res: MockProxy<NextApiResponse>

  beforeEach(() => {
    jest.clearAllMocks()
    req = mock<NextApiRequest>()
    res = mock<NextApiResponse>()
    res.status.mockReturnThis()
    res.json.mockReturnThis()
    res.setHeader.mockReturnThis()
    res.end.mockReturnThis()
  })

  it("should return 405 for non-POST methods", async () => {
    req.method = "GET"
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.setHeader).toHaveBeenCalledWith("Allow", ["POST", "OPTIONS"])
  })

  it("should return 200 for OPTIONS method", async () => {
    req.method = "OPTIONS"
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it("should return 400 if required fields are missing", async () => {
    req.method = "POST"
    req.body = { userId: "u1" }
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Missing required fields" })
  })

  it("should call findOrCreate and return 200 on success", async () => {
    const mockTable = { id: "t1", players: [] }
    const findOrCreateSpy = jest
      .spyOn(mockTableService.prototype, "findOrCreate")
      .mockResolvedValue(mockTable as any)

    req.method = "POST"
    req.body = { userId: "u1", userName: "user1", ruleType: "nineball" }

    await handler(req, res)

    expect(findOrCreateSpy).toHaveBeenCalledWith("u1", "user1", "nineball")
    expect(mockMarkUsage).toHaveBeenCalledWith("findOrCreateTable")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(mockTable)
  })

  it("should return 500 if findOrCreate throws", async () => {
    jest
      .spyOn(mockTableService.prototype, "findOrCreate")
      .mockRejectedValue(new Error("Database error"))
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()

    req.method = "POST"
    req.body = { userId: "u1", userName: "user1", ruleType: "nineball" }

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" })
    consoleSpy.mockRestore()
  })
})
