export const canChallenge = (target, currentUserId) => {
  if (!currentUserId) return false
  if (target.userId === currentUserId) return false
  if (target.tableId) return false
  if (target.seek) return false
  return true
}

export const canSpectate = (target, currentTableId) => {
  if (!target.tableId) return false
  if (currentTableId && target.tableId === currentTableId) return false
  return true
}

export const activeGames = (users) => {
  const gamesMap = new Map()
  for (const user of users) {
    if (user.tableId && !gamesMap.has(user.tableId)) {
      gamesMap.set(user.tableId, {
        tableId: user.tableId,
        players: [{ id: user.userId, name: user.userName }],
        ruleType: user.ruleType,
      })
    }
  }
  return Array.from(gamesMap.values())
}

export const parseMessage = (data) => {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export const isPresenceMessage = (msg) => {
  return msg?.messageType === "presence"
}

export const isChallengeMessage = (msg) => {
  return msg?.messageType === "challenge"
}

export const PresenceMessage = {}
export const ChallengeMessage = {}
export const TableMessage = {}
export const TableInfo = {}
export const ActiveGame = {}
export const Seek = {}
export const Meta = {}
