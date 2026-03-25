import React from "react"
import { localeToFlag } from "@/utils/locale"
import type { PresenceMessage } from "@tailuge/messaging"
import { UserItemActions } from "./UserItemActions"

interface UserListItemProps {
  readonly user: PresenceMessage
  readonly currentUserId?: string
  readonly onChallenge: (user: PresenceMessage) => void
}

export function UserListItem({
  user,
  currentUserId,
  onChallenge,
}: UserListItemProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-2 py-1 text-[14px] text-gray-300 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
      <span
        className="h-1 w-1 rounded-full bg-green-accent shadow-[0_0_5px_var(--color-green-glow)]"
        aria-hidden="true"
      />
      <span className="text-[14px] text-gray-300 truncate max-w-[100px]">
        {localeToFlag(user.meta?.country)} {user.userName}
      </span>
      <div className="flex items-center gap-0.5">
        <UserItemActions
          user={user}
          currentUserId={currentUserId}
          onChallenge={onChallenge}
        />
      </div>
    </div>
  )
}
