// src/components/OnlineCount.tsx
import { UsersIcon } from "@heroicons/react/24/solid"
import React from "react"

type OnlineCountProps = {
  readonly count: number
}

export function OnlineCount({ count }: OnlineCountProps) {
  return (
    <output
      className="flex items-center gap-1 text-green-400"
      aria-label={`${count} users online`}
    >
      <UsersIcon className="h-3 w-3" aria-hidden="true" />
      <span className="text-xs font-light tracking-wide uppercase">
        {count}
      </span>
    </output>
  )
}
