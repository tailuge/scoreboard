import { test, expect } from "@playwright/test"

const buildRematchUrl = (params: {
  userId: string
  userName: string
  opponentId: string
  opponentName: string
  ruleType: string
  lastScores: { userId: string; score: number }[]
  nextTurnId: string
}) => {
  const rematch = {
    opponentId: params.opponentId,
    opponentName: params.opponentName,
    ruleType: params.ruleType,
    lastScores: params.lastScores,
    nextTurnId: params.nextTurnId,
  }

  const query = new URLSearchParams({
    userId: params.userId,
    userName: params.userName,
    rematch: JSON.stringify(rematch),
  })

  return `/game?${query.toString()}`
}

test.describe.serial("rematch acceptance test", () => {
  test("one-way rematch should honor nextTurnId", async ({
    browser,
  }, testInfo) => {
    const suffix = `${testInfo.workerIndex}${Date.now().toString().slice(-4)}`
    const aliceId = `alice-${suffix}`
    const bobId = `bob-${suffix}`
    const aliceName = `Alice${suffix}`
    const bobName = `Bob${suffix}`
    const ruleType = "nineball"

    const lastScores = [
      { userId: aliceId, score: 0 },
      { userId: bobId, score: 3 },
    ]

    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    try {
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      const page1Url = buildRematchUrl({
        userId: aliceId,
        userName: aliceName,
        opponentId: bobId,
        opponentName: bobName,
        ruleType,
        lastScores,
        nextTurnId: aliceId,
      })

      const page2Url = `/game?userId=${bobId}&userName=${bobName}`

      await Promise.all([page1.goto(page1Url), page2.goto(page2Url)])

      const acceptButton = page2.getByRole("button", {
        name: "Accept challenge",
      })
      await expect(acceptButton).toBeVisible({ timeout: 10_000 })
      await acceptButton.click()

      const page1GameUrl = page1.waitForURL(
        /billiards\.tailuge\.workers\.dev/,
        {
          timeout: 10_000,
        }
      )
      const page2GameUrl = page2.waitForURL(
        /billiards\.tailuge\.workers\.dev/,
        {
          timeout: 10_000,
        }
      )

      await Promise.all([page1GameUrl, page2GameUrl])

      const page1FinalUrl = new URL(page1.url())
      const page2FinalUrl = new URL(page2.url())

      expect(page1FinalUrl.searchParams.get("first")).toBe("true")
      expect(page2FinalUrl.searchParams.get("first")).toBeNull()
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
