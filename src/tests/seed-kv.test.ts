import { kv } from "@vercel/kv"
import { mockkv } from "./mockkv"

jest.mock("@vercel/kv")

describe("seed kv", () => {
  it("should seed the mock kv", async () => {
    await mockkv.set("user-count", 5)
  })
})
