import React from "react"
import type { PresenceUser } from "./hooks/usePresenceList"

type UserBadgeProps = {
  readonly user: PresenceUser
  readonly currentUserId?: string
}

export function UserBadge({ user, currentUserId }: UserBadgeProps) {
  if (user.isBot) {
    return (
      <span className="text-[10px]" title="Bot">
        🤖
      </span>
    )
  }
  if (user.userId === currentUserId) {
    return (
      <span className="text-[10px]" title="Identified">
        ⭐
      </span>
    )
  }
  const isExternal = (() => {
    if (!user.originUrl) return false
    try {
      const url = new URL(user.originUrl, globalThis.location.origin)
      return url.hostname !== globalThis.location.hostname
    } catch {
      return false
    }
  })()

  return isExternal ? (
    <span className="text-[10px]" title="external">
      🎮
    </span>
  ) : null
}
