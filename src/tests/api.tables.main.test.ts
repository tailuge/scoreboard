import tablesHandler from "@/pages/api/tables"
import findOrCreateHandler from "@/pages/api/tables/find-or-create"
import joinHandler from "@/pages/api/tables/[tableId]/join"
import spectateHandler from "@/pages/api/tables/[tableId]/spectate"
import completeHandler from "@/pages/api/tables/[tableId]/complete"
import { TableService } from "@/services/TableService"
import { markUsageFromServer } from "@/utils/usage"
import { NextApiRequest, NextApiResponse } from "next"
import { mock, MockProxy } from "jest-mock-extended"

jest.mock("@/services/TableService")
jest.mock("@/utils/usage", () => ({ markUsageFromServer: jest.fn() }))

const mockTableService = TableService as jest.MockedClass<typeof TableService>

describe("Standard Tables API", () => {
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

  describe("/api/tables", () => {
    it("handles GET and POST", async () => {
      req.method = "GET"
      jest.spyOn(mockTableService.prototype, "getTables").mockResolvedValue([])
      await tablesHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)

      req.method = "POST"
      req.body = { userId: "u1", userName: "n1", ruleType: "9" }
      jest.spyOn(mockTableService.prototype, "createTable").mockResolvedValue({ id: "1" } as any)
      await tablesHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(201)
    })
  })

  describe("/api/tables/find-or-create", () => {
    it("handles POST findOrCreate", async () => {
      req.method = "POST"
      req.body = { userId: "u1", userName: "n1", gameType: "9" }
      jest.spyOn(mockTableService.prototype, "findOrCreate").mockResolvedValue({ id: "2" } as any)
      await findOrCreateHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
    it("rejects non-POST", async () => {
      req.method = "GET"
      await findOrCreateHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(405)
    })
  })

  describe("/api/tables/[tableId]/join", () => {
    it("handles PUT join", async () => {
      req.method = "PUT"
      req.query = { tableId: "t1" }
      req.body = { userId: "u1", userName: "n1" }
      jest.spyOn(mockTableService.prototype, "joinTable").mockResolvedValue({ id: "t1" } as any)
      await joinHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe("/api/tables/[tableId]/spectate", () => {
    it("handles PUT spectate", async () => {
      req.method = "PUT"
      req.query = { tableId: "t1" }
      req.body = { userId: "u1", userName: "n1" }
      jest.spyOn(mockTableService.prototype, "spectateTable").mockResolvedValue({ id: "t1" } as any)
      await spectateHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe("/api/tables/[tableId]/complete", () => {
    it("handles PUT complete", async () => {
      req.method = "PUT"
      req.query = { tableId: "t1" }
      jest.spyOn(mockTableService.prototype, "completeTable").mockResolvedValue({ id: "t1" } as any)
      await completeHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
