import handler from "../pages/api/doc"

jest.mock("next-swagger-doc", () => ({
  withSwagger: jest.fn(() =>
    jest.fn(() => (req: any, res: any) => {
      res.status(200).json({ openapi: "3.0.0" })
    })
  ),
}))

describe("/api/doc handler", () => {
  const oldEnv = process.env.NODE_ENV

  afterEach(() => {
    // @ts-expect-error NODE_ENV is read-only
    process.env.NODE_ENV = oldEnv
    jest.clearAllMocks()
  })

  it("should return 404 in production", async () => {
    // @ts-expect-error NODE_ENV is read-only
    process.env.NODE_ENV = "production"
    const req = { method: "GET" }
    const res = {
      status: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.end).toHaveBeenCalled()
  })

  it("should return 200 in development", async () => {
    // @ts-expect-error NODE_ENV is read-only
    process.env.NODE_ENV = "development"
    const req = { method: "GET" }
    const res = {
      status: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ openapi: "3.0.0" })
  })
})
