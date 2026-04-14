import React from "react"
import type { PresenceMessage } from "@tailuge/messaging"
import { UserListItem } from "./UserListItem"

interface UserListProps {
  readonly users: PresenceMessage[]
  readonly currentUserId?: string
  readonly unreadUsers?: string[]
  readonly onChallenge: (user: PresenceMessage) => void
  readonly onChat: (user: PresenceMessage) => void
  readonly className?: string
}

export function UserList({
  users,
  currentUserId,
  unreadUsers = [],
  onChallenge,
  onChat,
  className = "",
}: UserListProps) {
  const otherUsers = users.filter((user) => user.userId !== currentUserId)

  // Deduplicate by userId to show only one row per human
  const uniqueUsers = Array.from(
    new Map(otherUsers.map((user) => [user.userId, user])).values()
  )

  return (
    <div className={`flex flex-wrap justify-between gap-2 ${className}`}>
      {uniqueUsers.map((user) => (
        <UserListItem
          key={user.userId}
          user={user}
          currentUserId={currentUserId}
          hasUnread={unreadUsers.includes(user.userId)}
          onChallenge={onChallenge}
          onChat={onChat}
        />
      ))}
    </div>
  )
}
