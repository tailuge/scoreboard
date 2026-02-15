import { getApiDocs } from "@/lib/swagger"

describe("swagger lib", () => {
  it("should return a valid swagger spec", async () => {
    const spec = (await getApiDocs()) as {
      openapi: string
      info: { title: string }
    }
    expect(spec).toBeDefined()
    expect(spec.openapi).toBe("3.0.0")
    expect(spec.info.title).toBe("Scoreboard API")
  })
})
