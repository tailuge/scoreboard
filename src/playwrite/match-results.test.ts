import { test, expect } from "@playwright/test"

test("match history display in lobby", async ({ page, request }) => {
  const newMatch = {
    winner: "PlaywrightWinner",
    loser: "PlaywrightLoser",
    winnerScore: 100,
    loserScore: 50,
    ruleType: "snooker",
    timestamp: Date.now(),
  }

  // Mock the API response to avoid dependency on KV
  await page.route("**/api/match-results", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([newMatch]),
      })
    } else {
      await route.continue()
    }
  })

  // 2. Go to game page
  await page.goto("/game")

  // 3. Verify the match appears in the "Recent Matches" list
  const historyList = page
    .locator('h2:has-text("Recent Matches")')
    .locator("xpath=..")
  await expect(historyList.getByText("PlaywrightWinner")).toBeVisible()
  await expect(historyList.getByText("PlaywrightLoser")).toBeVisible()
  await expect(historyList.getByText("100")).toBeVisible()
  await expect(historyList.getByText("50")).toBeVisible()
})
