import request from "supertest"
import server from "../src/server"

afterAll(async () => {
  await server.close()
})

describe("service root", () => {
  test("root responds with html", async () => {
    const response = await request(server).get("/")
    expect(response.statusCode).toBe(200)
  })

  test("unknown route", async () => {
    const response = await request(server).get("/xyz")
    expect(response.statusCode).toBe(200)
  })
})
