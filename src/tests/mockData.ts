export const mockTable = {
  id: "t1",
  creator: { id: "user-1", name: "User One" },
  players: [{ id: "user-1", name: "User One" }],
  spectators: [],
  createdAt: Date.now(),
  lastUsedAt: Date.now(),
  isActive: true,
  ruleType: "nineball",
  completed: false,
}

export const mockTables = [mockTable]

export const mockMatchResult = {
  id: "match-1",
  winner: "Player One",
  loser: "Player Two",
  winnerScore: 10,
  loserScore: 5,
  ruleType: "nineball",
  timestamp: Date.now(),
}

export const mockMatchResults = [mockMatchResult]

export const mockLeaderboardData = [
  { id: "1", name: "Player 1", score: 100, likes: 5 },
  { id: "2", name: "Player 2", score: 90, likes: 3 },
  { id: "3", name: "Player 3", score: 80, likes: 1 },
  { id: "4", name: "Player 4", score: 70, likes: 0 },
]
