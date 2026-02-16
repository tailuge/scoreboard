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
