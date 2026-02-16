import { isValidGameType, VALID_RULE_TYPES } from "../utils/gameTypes"

describe("gameTypes", () => {
  describe("isValidGameType", () => {
    it("should return true for all valid rule types", () => {
      VALID_RULE_TYPES.forEach((ruleType) => {
        expect(isValidGameType(ruleType)).toBe(true)
      })
    })

    it("should return false for invalid rule types", () => {
      expect(isValidGameType("football")).toBe(false)
      expect(isValidGameType("")).toBe(false)
      expect(isValidGameType("123")).toBe(false)
      expect(isValidGameType("snooker ")).toBe(false)
    })
  })
})
