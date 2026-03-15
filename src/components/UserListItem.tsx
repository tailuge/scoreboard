import React from "react"
import { localeToFlag } from "@/utils/locale"
import { browserIcon, osIcon, detectOS, detectBrowser } from "@/utils/ua"
import type { PresenceMessage } from "@tailuge/messaging"
import { UserBadge } from "./UserBadge"

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
  const userAgent = user.meta?.ua

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
        <span className="text-[9px]">{osIcon(detectOS(userAgent))}</span>
        <span className="text-[9px]">
          {browserIcon(detectBrowser(userAgent))}
        </span>
        <UserBadge user={user} currentUserId={currentUserId} />
        {user.userId !== currentUserId && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChallenge(user)
            }}
            aria-label={`Challenge ${user.userName}`}
            className="ml-2 px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 hover:bg-cyan-500/40 transition-colors"
          >
            Challenge
          </button>
        )}
      </div>
    </li>
  )
}
