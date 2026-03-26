import React from "react"
import { localeToFlag } from "@/utils/locale"
import type { PresenceMessage } from "@tailuge/messaging"
import { UserItemActions } from "./UserItemActions"
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/solid"

interface UserListItemProps {
  readonly user: PresenceMessage
  readonly currentUserId?: string
  readonly hasUnread?: boolean
  readonly onChallenge: (user: PresenceMessage) => void
  readonly onChat: (user: PresenceMessage) => void
}

export function UserListItem({
  user,
  currentUserId,
  hasUnread,
  onChallenge,
  onChat,
}: UserListItemProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-1 py-1 text-[14px] text-gray-300 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
      <button
        onClick={() => onChat(user)}
        className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
        aria-label={`Chat with ${user.userName}`}
      >
        <span className="text-[14px] truncate max-w-[100px]">
          {localeToFlag(user.meta?.country)} {user.userName}
        </span>
        {hasUnread ? (
          <ChatBubbleLeftEllipsisIcon className="h-3 w-3 text-cyan-400 animate-pulse" />
        ) : null}
      </button>
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
