import React from "react"
import type { PresenceMessage } from "@tailuge/messaging"

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
  const host = user.meta?.host
  const currentHost = globalThis.location?.host
  const isExternal =
    !!host && !!currentHost && host !== currentHost && host !== "localhost"

  return isExternal ? (
    <span className="text-[10px]" title="external">
      🎮
    </span>
  ) : null
}
