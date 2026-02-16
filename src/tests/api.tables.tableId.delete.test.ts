import handler from "@/pages/api/tables/[tableId]/delete"
import { TableService } from "@/services/TableService"
import { logger } from "@/utils/logger"
import { NextApiRequest, NextApiResponse } from "next"
import { mock } from "jest-mock-extended"

jest.mock("@/services/TableService")
jest.mock("@/utils/logger")

const mockTableService = TableService as jest.MockedClass<typeof TableService>

describe("/api/tables/[tableId]/delete", () => {
  let req: NextApiRequest
  let res: NextApiResponse

  beforeEach(() => {
    req = mock<NextApiRequest>()
    res = mock<NextApiResponse>()
    req.query = { tableId: "table-1" }
    ;(res.status as jest.Mock).mockReturnThis()
    ;(res.json as jest.Mock).mockReturnThis()
    ;(res.end as jest.Mock).mockReturnThis()
  })

  it("should return 400 if userId is missing on POST", async () => {
    req.method = "POST"
    req.body = {}

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Missing userId" })
  })

  it("should return 400 if userId is missing on DELETE", async () => {
    req.method = "DELETE"
    req.body = {}

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ error: "Missing userId" })
  })

  it("should delete a table successfully via POST", async () => {
    req.method = "POST"
    req.body = { userId: "user-1" }
    ;(mockTableService.prototype.deleteTable as jest.Mock).mockResolvedValue(true)

    await handler(req, res)

    expect(mockTableService.prototype.deleteTable).toHaveBeenCalledWith("table-1", "user-1")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it("should delete a table successfully via DELETE", async () => {
    req.method = "DELETE"
    req.body = { userId: "user-1" }
    ;(mockTableService.prototype.deleteTable as jest.Mock).mockResolvedValue(true)

    await handler(req, res)

    expect(mockTableService.prototype.deleteTable).toHaveBeenCalledWith("table-1", "user-1")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it("should return 403 if deletion fails (unauthorized or not found)", async () => {
    req.method = "POST"
    req.body = { userId: "user-1" }
    ;(mockTableService.prototype.deleteTable as jest.Mock).mockResolvedValue(false)

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized or table not found" })
  })

  it("should return 500 if TableService throws an error", async () => {
    req.method = "POST"
    req.body = { userId: "user-1" }
    const error = new Error("Database error")
    ;(mockTableService.prototype.deleteTable as jest.Mock).mockRejectedValue(error)

    await handler(req, res)

    expect(logger.error).toHaveBeenCalledWith("Error deleting table:", error)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" })
  })

  it("should return 200 for OPTIONS method", async () => {
    req.method = "OPTIONS"

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.end).toHaveBeenCalled()
  })

  it("should return 405 for unsupported methods", async () => {
    req.method = "GET"

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" })
  })
})
