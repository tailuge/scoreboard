import handler from "@/pages/api/tables/[tableId]/delete"
import { TableService } from "@/services/TableService"
import { logger } from "@/utils/logger"
import { NextApiRequest, NextApiResponse } from "next"
import { createMockRequestResponse } from "./apiTestUtils"

jest.mock("@/services/TableService")
jest.mock("@/utils/logger")

const tableServiceMock = TableService as jest.MockedClass<typeof TableService>

describe("Delete Table API [tableId]", () => {
  let requestObj: NextApiRequest
  let responseObj: NextApiResponse

  beforeEach(() => {
    const { req, res } = createMockRequestResponse()
    requestObj = req
    responseObj = res
    requestObj.query = { tableId: "delete-me-123" }
    ;(responseObj.end as jest.Mock) = jest.fn().mockReturnThis()
  })

  test.each(["POST", "DELETE"])(
    "validates missing userId for %s",
    async (m) => {
      requestObj.method = m
      requestObj.body = {}

      await handler(requestObj, responseObj)

      expect(responseObj.status).toHaveBeenCalledWith(400)
      expect(responseObj.json).toHaveBeenCalledWith({ error: "Missing userId" })
    }
  )

  test.each(["POST", "DELETE"])(
    "performs deletion successfully via %s",
    async (method) => {
      requestObj.method = method
      requestObj.body = { userId: "admin-remover" }
      ;(tableServiceMock.prototype.deleteTable as jest.Mock).mockResolvedValue(
        true
      )

      await handler(requestObj, responseObj)

      expect(tableServiceMock.prototype.deleteTable).toHaveBeenCalledWith(
        "delete-me-123",
        "admin-remover"
      )
      expect(responseObj.status).toHaveBeenCalledWith(200)
      expect(responseObj.json).toHaveBeenCalledWith({ success: true })
    }
  )

  it("handles forbidden deletion attempt", async () => {
    requestObj.method = "POST"
    requestObj.body = { userId: "unauthorized-user" }
    ;(tableServiceMock.prototype.deleteTable as jest.Mock).mockResolvedValue(
      false
    )

    await handler(requestObj, responseObj)

    expect(responseObj.status).toHaveBeenCalledWith(403)
    expect(responseObj.json).toHaveBeenCalledWith({
      error: "Unauthorized or table not found",
    })
  })

  it("reports service-level failures", async () => {
    requestObj.method = "POST"
    requestObj.body = { userId: "some-user" }
    const fault = new Error("KV connectivity issue")
    ;(tableServiceMock.prototype.deleteTable as jest.Mock).mockRejectedValue(
      fault
    )

    await handler(requestObj, responseObj)

    expect(logger.error).toHaveBeenCalledWith("Error deleting table:", fault)
    expect(responseObj.status).toHaveBeenCalledWith(500)
    expect(responseObj.json).toHaveBeenCalledWith({
      error: "Internal Server Error",
    })
  })

  it("returns 200 on OPTIONS preflight", async () => {
    requestObj.method = "OPTIONS"
    await handler(requestObj, responseObj)
    expect(responseObj.status).toHaveBeenCalledWith(200)
    expect(responseObj.end).toHaveBeenCalled()
  })

  it("returns 405 for forbidden methods like GET", async () => {
    requestObj.method = "GET"
    await handler(requestObj, responseObj)
    expect(responseObj.status).toHaveBeenCalledWith(405)
    expect(responseObj.json).toHaveBeenCalledWith({
      error: "Method not allowed",
    })
  })
})
