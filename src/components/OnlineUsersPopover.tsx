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

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          <div className="min-w-[180px] max-w-[220px] rounded-xl bg-obsidian-glass backdrop-blur-xl border border-gunmetal shadow-2xl relative overflow-hidden">
            <div className="online-users-border" />

            <div className="relative p-3">
              <div className="flex items-center justify-between mb-3 border-b border-gunmetal/50 pb-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-green-accent/70">
                  Online Users
                </span>
                <span className="h-1 w-1 rounded-full bg-green-accent animate-pulse" />
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
                    {user.userId === currentUserId ? (
                      <span className="text-[8px] text-green-accent/50 uppercase">
                        Identified
                      </span>
                    ) : (
                      <span className="text-[8px] text-gray-500 uppercase">
                        Online
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {overflow > 0 && (
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  +{overflow} more active
                </p>
              )}

              <div className="mt-3 pt-2 border-t border-gunmetal/50 flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider text-gray-500">
                  Total Active:
                </span>
                <span className="text-[11px] text-green-accent font-bold">
                  {totalCount || count}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
