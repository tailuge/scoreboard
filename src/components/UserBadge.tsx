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
  const origin = user.meta?.origin
  const currentHost = globalThis.location?.host
  const isExternal = !!origin && !!currentHost && origin !== currentHost

  return isExternal ? (
    <span className="text-[10px]" title="external">
      🎮
    </span>
  ) : null
}
