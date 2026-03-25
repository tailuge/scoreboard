import React from "react"
import { browserIcon, osIcon, detectOS, detectBrowser } from "@/utils/ua"
import type { PresenceMessage } from "@tailuge/messaging"
import { canChallenge } from "@tailuge/messaging"
import { UserBadge } from "./UserBadge"

interface UserItemActionsProps {
  readonly user: PresenceMessage
  readonly currentUserId?: string
  readonly onChallenge: (user: PresenceMessage) => void
}

export function UserItemActions({
  user,
  currentUserId,
  onChallenge,
}: UserItemActionsProps) {
  const userAgent = user.meta?.ua

  return (
    <>
      <span className="text-[10px]">{osIcon(detectOS(userAgent))}</span>
      <span className="text-[10px]">
        {browserIcon(detectBrowser(userAgent))}
      </span>
      <UserBadge user={user} currentUserId={currentUserId} />
      {Boolean(currentUserId) && canChallenge(user, currentUserId) && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onChallenge(user)
          }}
          aria-label={`Challenge ${user.userName}`}
          className="ml-2 px-1.5 py-0.5 rounded-[5px] bg-cyan-500/20 border border-cyan-500/40 text-[10px] text-cyan-300 hover:bg-cyan-500/40 transition-colors"
        >
          Challenge
        </button>
      )}
    </>
  )
}
