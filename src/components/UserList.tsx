import React from "react"
import type { PresenceMessage } from "@tailuge/messaging"
import { UserListItem } from "./UserListItem"

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
    <div className={`flex flex-wrap justify-between gap-2 ${className}`}>
      {otherUsers.map((user) => (
        <UserListItem
          key={user.userId}
          user={user}
          currentUserId={currentUserId}
          onChallenge={onChallenge}
        />
      ))}
    </div>
  )
}
