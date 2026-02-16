import { STATUS_PAGE_URL } from "../utils/constants"

describe("constants", () => {
  it("should have the correct STATUS_PAGE_URL", () => {
    expect(STATUS_PAGE_URL).toBe(
      "https://billiards-network.onrender.com/basic_status"
    )
  })
})
