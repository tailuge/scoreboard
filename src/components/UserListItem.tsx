import React from "react"
import { localeToFlag } from "@/utils/locale"
import { browserIcon, osIcon, detectOS, detectBrowser } from "@/utils/ua"
import type { PresenceUser } from "./hooks/usePresenceList"
import { UserBadge } from "./UserBadge"

type UserListItemProps = {
  readonly user: PresenceUser
  readonly currentUserId?: string
  readonly onChallenge: (user: PresenceUser) => void
}

export function UserListItem({
  user,
  currentUserId,
  onChallenge,
}: UserListItemProps) {
  return (
    <li className="flex items-center justify-between group stagger-item">
      <div className="flex items-center gap-2">
        <span
          className="h-1 w-1 rounded-full bg-green-accent shadow-[0_0_5px_var(--color-green-glow)]"
          aria-hidden="true"
        />
        <span className="text-[11px] text-gray-300 truncate max-w-[100px]">
          {localeToFlag(user.locale)?.replace("🇺🇸", "🇬🇧")} {user.userName}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <span className="text-[9px]">{osIcon(detectOS(user.ua))}</span>
        <span className="text-[9px]">{browserIcon(detectBrowser(user.ua))}</span>
        <UserBadge user={user} currentUserId={currentUserId} />
        {user.userId !== currentUserId && !user.isBot && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChallenge(user)
            }}
            className="ml-2 px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 hover:bg-cyan-500/40 transition-colors"
          >
            Challenge
          </button>
        )}
      </div>
    </li>
  )
}
