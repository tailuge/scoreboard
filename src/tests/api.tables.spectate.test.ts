import handler from "@/pages/api/tables/[tableId]/spectate"
import { TableService } from "@/services/TableService"
import { NextApiRequest, NextApiResponse } from "next"
import { mock, MockProxy } from "jest-mock-extended"

// Mock the TableService
jest.mock("@/services/TableService")

const mockTableService = TableService as jest.MockedClass<typeof TableService>

describe("/api/tables/[tableId]/spectate handler", () => {
  let req: MockProxy<NextApiRequest>
  let res: MockProxy<NextApiResponse>
  const tableId = "test-spectate-id"

  beforeEach(() => {
    jest.clearAllMocks()

    req = mock<NextApiRequest>()
    res = mock<NextApiResponse>()
    res.status.mockReturnThis()
    res.json.mockReturnThis()

    // Default query for tableId
    req.query = { tableId }
  })

  describe("PUT method", () => {
    it("should allow a user to spectate and return the table with a 200 status", async () => {
      const spectateData = { userId: "spec-1", userName: "SpectatorOne" }
      const updatedTable = { id: tableId, spectators: [spectateData] }

      // Mock the service method to resolve successfully
      const spectateTableSpy = jest
        .spyOn(mockTableService.prototype, "spectateTable")
        .mockResolvedValue(updatedTable as any)

      req.method = "PUT"
      req.body = spectateData

      await handler(req, res)

      expect(spectateTableSpy).toHaveBeenCalledWith(
        tableId,
        spectateData.userId,
        spectateData.userName
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(updatedTable)
    })

    it("should return a 400 status when the service throws an error", async () => {
      const spectateData = { userId: "spec-2", userName: "SpectatorTwo" }
      const errorMessage = "Table not found"

      // Mock the service method to reject with an error
      const spectateTableSpy = jest
        .spyOn(mockTableService.prototype, "spectateTable")
        .mockRejectedValue(new Error(errorMessage))

      req.method = "PUT"
      req.body = spectateData

      await handler(req, res)

      expect(spectateTableSpy).toHaveBeenCalledWith(
        tableId,
        spectateData.userId,
        spectateData.userName
      )
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage })
    })
  })

  describe("Other methods", () => {
    it("should return a 405 error for non-PUT methods", async () => {
      req.method = "POST"

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" })
    })
  })
})
