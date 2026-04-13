/**
 * Build game options from current UI state
 * Used by both single-player URLs and challenge offers
 */
export function buildGameOptions(params: {
  ruleType: string
  snookerReds?: number
  threecushionRaceTo?: number
  nineballOption?: string
}): Record<string, string> {
  const options: Record<string, string> = {}

  if (params.ruleType === "snooker" && params.snookerReds !== undefined) {
    options.reds = String(params.snookerReds)
  } else if (
    params.ruleType === "threecushion" &&
    params.threecushionRaceTo !== undefined
  ) {
    options.raceTo = String(params.threecushionRaceTo)
  } else if (
    params.ruleType === "nineball" &&
    params.nineballOption === "Free"
  ) {
    options.practice = "true"
  }

  return options
}
