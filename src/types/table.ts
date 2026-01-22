import { Player } from "./player"

export interface Table {
  id: string
  creator: Player
  players: Player[]
  spectators: Player[]
  createdAt: number
  lastUsedAt: number
  isActive: boolean
  ruleType: string
  completed: boolean
}
