import { isValidGameType } from "@/utils/gameTypes"

describe("gameTypes utility", () => {
  it("should return true for valid game types", () => {
    expect(isValidGameType("snooker")).toBe(true)
    expect(isValidGameType("nineball")).toBe(true)
    expect(isValidGameType("threecushion")).toBe(true)
    expect(isValidGameType("eightball")).toBe(true)
  })

  it("should return false for invalid game types", () => {
    expect(isValidGameType("invalid")).toBe(false)
    expect(isValidGameType("")).toBe(false)
    expect(isValidGameType(null)).toBe(false)
  })
})
