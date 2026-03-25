import React from "react"
import { localeToFlag } from "@/utils/locale"
import type { PresenceMessage } from "@tailuge/messaging"
import { UserItemActions } from "./UserItemActions"

interface UserListProps {
  readonly users: PresenceMessage[]
  readonly currentUserId?: string
  readonly onChallenge: (user: PresenceMessage) => void
  readonly className?: string
}

export function UserList({
  users,
  currentUserId,
  onChallenge,
  className = "",
}: UserListProps) {
  const otherUsers = users.filter((user) => user.userId !== currentUserId)

  return (
    <div className={`flex ${className}`}>
      {otherUsers.map((user) => (
        <div key={user.userId} className="flex items-center gap-2 stagger-item">
          <span
            className="h-1 w-1 rounded-full bg-green-accent shadow-[0_0_5px_var(--color-green-glow)]"
            aria-hidden="true"
          />
          <span className="text-[11px] text-gray-300 truncate max-w-[100px]">
            {localeToFlag(user.meta?.country)?.replace("🇺🇸", "🇬🇧")}{" "}
            {user.userName}
          </span>
          <div className="flex items-center gap-0.5">
            <UserItemActions
              user={user}
              currentUserId={currentUserId}
              onChallenge={onChallenge}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
