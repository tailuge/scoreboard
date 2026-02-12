// src/components/OnlineUsersPopover.tsx
import { UsersIcon } from "@heroicons/react/24/solid"
import React, { useState, useRef, useEffect } from "react"
import type { PresenceUser } from "./hooks/usePresence"

type OnlineUsersPopoverProps = {
  readonly count: number
  readonly users: PresenceUser[]
  readonly totalCount?: number
  readonly currentUserId?: string
}

export function OnlineUsersPopover({
  count,
  users,
  totalCount,
  currentUserId,
}: OnlineUsersPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const options: AddEventListenerOptions = { passive: true }
    document.addEventListener("mousedown", handleClickOutside, options)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, options)
    }
  }, [isOpen])

  const overflow = totalCount ? totalCount - users.length : 0

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          console.log("Online users:", JSON.stringify(users, null, 2))
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors cursor-pointer"
        aria-label={`${count} users online`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <UsersIcon className="h-3 w-3" aria-hidden="true" />
        <span className="text-xs font-light tracking-wide uppercase">
          {count}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 z-50 min-w-[120px] max-w-[160px] rounded-xl bg-[rgba(13,14,18,0.95)] shadow-lg"
          role="listbox"
          aria-label="Online users"
          style={{ zIndex: 9999 }}
        >
          <div className="online-users-border" />
          <div className="relative py-2 px-3">
            <ul className="space-y-0.5">
              {users.map((user) => (
                <li
                  key={user.userId}
                  className="flex items-center gap-1.5"
                  role="option"
                  aria-selected="false"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-light text-gray-300 truncate">
                    {user.userName}
                    {user.userId === currentUserId && " (you)"}
                  </span>
                </li>
              ))}
            </ul>
            {overflow > 0 && (
              <p className="text-[10px] font-light text-gray-500 mt-1.5 pt-1 border-t border-gray-700/50">
                +{overflow} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
