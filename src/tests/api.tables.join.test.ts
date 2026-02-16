import handler from "@/pages/api/tables/[tableId]/join"
import { TableService } from "@/services/TableService"
import { markUsageFromServer } from "@/utils/usage"
import { NextApiRequest, NextApiResponse } from "next"
import { MockProxy } from "jest-mock-extended"
import { createMockRequestResponse } from "./apiTestUtils"

// Mock the dependencies
jest.mock("@/services/TableService")
jest.mock("@/utils/usage", () => ({
  markUsageFromServer: jest.fn(),
}))

const mockTableService = TableService as jest.MockedClass<typeof TableService>
const mockMarkUsage = markUsageFromServer as jest.Mock

describe("/api/tables/[tableId]/join handler", () => {
  let req: MockProxy<NextApiRequest>
  let res: MockProxy<NextApiResponse>
  const tableId = "test-table-id"

  beforeEach(() => {
    jest.clearAllMocks()
    ;({ req, res } = createMockRequestResponse())

    // Set a default query for the tableId
    req.query = { tableId }
  })

  describe("PUT method", () => {
    it("should join a table and return it with a 200 status code", async () => {
      const joinData = { userId: "user-2", userName: "PlayerTwo" }
      const updatedTable = { id: tableId, players: [{}, joinData] }

      // Mock the service method to resolve successfully
      const joinTableSpy = jest
        .spyOn(mockTableService.prototype, "joinTable")
        .mockResolvedValue(updatedTable as any)

      req.method = "PUT"
      req.body = joinData

      await handler(req, res)

      expect(joinTableSpy).toHaveBeenCalledWith(
        tableId,
        joinData.userId,
        joinData.userName
      )
      expect(mockMarkUsage).toHaveBeenCalledWith("joinTable")
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(updatedTable)
    })

    it("should return a 400 status code when the service throws an error", async () => {
      const joinData = { userId: "user-3", userName: "PlayerThree" }
      const errorMessage = "Table is full"

      // Mock the service method to reject with an error
      const joinTableSpy = jest
        .spyOn(mockTableService.prototype, "joinTable")
        .mockRejectedValue(new Error(errorMessage))

      req.method = "PUT"
      req.body = joinData

      await handler(req, res)

      expect(joinTableSpy).toHaveBeenCalledWith(
        tableId,
        joinData.userId,
        joinData.userName
      )
      expect(mockMarkUsage).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage })
    })
  })

  describe("Other methods", () => {
    it("should return a 405 error for non-PUT methods", async () => {
      req.method = "GET" // Example of a non-allowed method

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" })
    })
  })
})
