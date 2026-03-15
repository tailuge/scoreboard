import React from "react"
import { LiveMatchesList } from "./LiveMatchesList"
import { useMessaging } from "@/contexts/MessagingContext"

export function LiveMatchesPanel() {
  const { activeGames } = useMessaging()

  return <LiveMatchesList games={activeGames} />
}
