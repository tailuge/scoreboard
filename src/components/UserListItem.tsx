import React from "react"
import { localeToFlag } from "@/utils/locale"
import type { PresenceMessage } from "@tailuge/messaging"
import { UserItemActions } from "./UserItemActions"

type UserListItemProps = {
  readonly user: PresenceMessage
  readonly currentUserId?: string
  readonly onChallenge: (user: PresenceMessage) => void
}

export function UserListItem({
  user,
  currentUserId,
  onChallenge,
}: UserListItemProps) {
  const countryCode = user.meta?.country

  return (
    <li className="flex items-center justify-between group stagger-item">
      <div className="flex items-center gap-2">
        <span
          className="h-1 w-1 rounded-full bg-green-accent shadow-[0_0_5px_var(--color-green-glow)]"
          aria-hidden="true"
        />
        <span className="text-[11px] text-gray-300 truncate max-w-[100px]">
          {localeToFlag(countryCode)?.replace("🇺🇸", "🇬🇧")} {user.userName}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <UserItemActions
          user={user}
          currentUserId={currentUserId}
          onChallenge={onChallenge}
        />
      </div>
    </li>
  )
}
