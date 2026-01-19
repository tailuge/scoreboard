import handler from "@/pages/api/tables/[tableId]/complete";
import { TableService } from "@/services/TableService";
import { NextApiRequest, NextApiResponse } from "next";
import { mock } from "jest-mock-extended";
import { Table } from "@/services/table";

jest.mock("@/services/TableService");

const mockTableService = TableService as jest.MockedClass<typeof TableService>;

describe("PUT /api/tables/[tableId]/complete", () => {
  let req: NextApiRequest;
  let res: NextApiResponse;

  beforeEach(() => {
    req = mock<NextApiRequest>();
    res = mock<NextApiResponse>();
    req.query = { tableId: "table-1" };
    // Chain mock functions for res.status().json()
    (res.status as jest.Mock).mockReturnThis();
    (res.json as jest.Mock).mockReturnThis();
  });

  it("should complete a table and return it", async () => {
    req.method = "PUT";
    const mockTable: Partial<Table> = { id: "table-1", state: "completed" };
    (mockTableService.prototype.completeTable as jest.Mock).mockResolvedValue(
      mockTable
    );

    await handler(req, res);

    expect(TableService.prototype.completeTable).toHaveBeenCalledWith("table-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockTable);
  });

  it("should return 400 if completing the table fails", async () => {
    req.method = "PUT";
    const errorMessage = "Table not found";
    (mockTableService.prototype.completeTable as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    await handler(req, res);

    expect(TableService.prototype.completeTable).toHaveBeenCalledWith("table-1");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });

  it("should return 405 if the method is not PUT", async () => {
    req.method = "GET";

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });
});
