// src/components/OnlineUsersPopover.tsx
import { UsersIcon } from "@heroicons/react/24/solid"
import React, { useState, useRef, useEffect } from "react"
import { localeToFlag } from "@/utils/locale"
import type { PresenceUser } from "./hooks/usePresenceList"

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

  // Close on click outside
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

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const overflow = totalCount ? totalCount - users.length : 0

  const getUserBadge = (user: PresenceUser) => {
    if (user.isBot) {
      return (
        <span className="text-[10px]" title="Bot">
          🤖
        </span>
      )
    }
    if (user.userId === currentUserId) {
      return (
        <span className="text-[10px]" title="Identified">
          ⭐
        </span>
      )
    }
    const cleanOrigin = user.originUrl?.replace("origin:", "") ?? ""
    if (cleanOrigin.includes("github.io")) {
      return (
        <span className="text-[10px]" title="github.io">
          🎮
        </span>
      )
    }
    return null
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => {
          if (!isOpen) console.log("Online users:", users)
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-1.5 text-green-accent hover:text-green-400 transition-all cursor-pointer group px-2 py-1 rounded-md hover:bg-green-accent/10"
        aria-label={`${count} users online`}
        aria-expanded={isOpen}
      >
        <UsersIcon
          className="h-3.5 w-3.5 group-hover:scale-110 transition-transform"
          aria-hidden="true"
        />
        <span className="text-[11px] tracking-widest font-bold">{count}</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 z-50 m-0 p-0 bg-transparent overflow-visible animate-in block border-none"
          aria-label="Online users"
        >
          <div className="min-w-[200px] max-w-[260px] rounded-xl bg-gunmetal/60 backdrop-blur-sm border border-gunmetal shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.05) 100%)",
              }}
            />

            <div className="relative p-3">
              <div className="flex items-center justify-between mb-3 border-b border-gunmetal/50 pb-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-green-accent/70">
                  Online Users
                </span>
              </div>

              <ul className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {users.map((user) => (
                  <li
                    key={user.userId}
                    className="flex items-center justify-between group stagger-item"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1 w-1 rounded-full bg-green-accent shadow-[0_0_5px_var(--color-green-glow)]"
                        aria-hidden="true"
                      />
                      <span className="text-[11px] text-gray-300 truncate max-w-[100px]">
                        {localeToFlag(user.locale)} {user.userName}
                      </span>
                    </div>
                    {getUserBadge(user)}
                  </li>
                ))}
              </ul>

              {overflow > 0 && (
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  +{overflow} more active
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
