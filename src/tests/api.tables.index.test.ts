import handler from "@/pages/api/tables"
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

describe("/api/tables handler", () => {
  let req: MockProxy<NextApiRequest>
  let res: MockProxy<NextApiResponse>

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Create mock request and response objects
    req = mock<NextApiRequest>()
    res = mock<NextApiResponse>()
    // Chainable mock for response methods
    res.status.mockReturnThis()
    res.json.mockReturnThis()
  })

  describe("GET method", () => {
    it("should return a list of tables with a 200 status code", async () => {
      const mockTables = [
        { id: "1", name: "Table 1" },
        { id: "2", name: "Table 2" },
      ]
      // Mock the service method
      const getTablesSpy = jest
        .spyOn(mockTableService.prototype, "getTables")
        .mockResolvedValue(mockTables as any)

      req.method = "GET"

      await handler(req, res)

      expect(getTablesSpy).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockTables)
    })
  })

  describe("POST method", () => {
    it("should create a new table and return it with a 201 status code", async () => {
      const newTableData = {
        userId: "user123",
        userName: "John Doe",
        ruleType: "nineball",
      }
      const createdTable = { id: "3", ...newTableData }

      // Mock the service method
      const createTableSpy = jest
        .spyOn(mockTableService.prototype, "createTable")
        .mockResolvedValue(createdTable as any)

      req.method = "POST"
      req.body = newTableData

      await handler(req, res)

      expect(createTableSpy).toHaveBeenCalledWith(
        newTableData.userId,
        newTableData.userName,
        newTableData.ruleType
      )
      expect(mockMarkUsage).toHaveBeenCalledWith("createTable")
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(createdTable)
    })
  })
})
