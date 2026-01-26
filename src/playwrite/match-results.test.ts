import { test, expect } from "@playwright/test"

test("match history display in lobby", async ({ page, request }) => {
  // 1. Add a match result via API
  const newMatch = {
    winner: "PlaywrightWinner",
    loser: "PlaywrightLoser",
    winnerScore: 100,
    loserScore: 50,
    gameType: "snooker",
    timestamp: Date.now(),
  }

  const postResponse = await request.post("/api/match-results", {
    data: newMatch,
  })
  expect(postResponse.ok()).toBeTruthy()

  // 2. Go to lobby
  await page.goto("/lobby")

  // 3. Verify the match appears in the "Recent Matches" list
  const historyList = page
    .locator('h2:has-text("Recent Matches")')
    .locator("xpath=..")
  await expect(historyList.getByText("PlaywrightWinner")).toBeVisible()
  await expect(historyList.getByText("PlaywrightLoser")).toBeVisible()
  await expect(historyList.getByText("100")).toBeVisible()
  await expect(historyList.getByText("50")).toBeVisible()
})
