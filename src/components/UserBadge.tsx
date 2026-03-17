import React from "react"
import type { PresenceMessage } from "@tailuge/messaging"
import { getOriginEmoji } from "@/utils/presence"

type UserBadgeProps = {
  readonly user: PresenceMessage
  readonly currentUserId?: string
}

export function UserBadge({ user, currentUserId }: UserBadgeProps) {
  if (user.userId === currentUserId) {
    return (
      <span className="text-[10px]" title="Identified">
        ⭐
      </span>
    )
  }
  const origin = user.meta?.origin
  const { emoji, title } = getOriginEmoji(origin, (user as any)?.ruletype)

  return (
    <span className="text-[10px]" title={title}>
      {emoji}
    </span>
  )
}
