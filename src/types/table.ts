import { Player } from "./player"
import { RuleType } from "@/utils/gameTypes"

export interface Table {
  id: string
  creator: Player
  players: Player[]
  spectators: Player[]
  createdAt: number
  lastUsedAt: number
  isActive: boolean
  ruleType: RuleType
  completed: boolean
}
