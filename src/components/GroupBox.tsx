// src/components/GroupBox.tsx
import React from "react"

type GroupBoxProps = {
  readonly title: string
  readonly children: React.ReactNode
  readonly rightBadge?: React.ReactNode
}

export function GroupBox({ title, children, rightBadge }: GroupBoxProps) {
  return (
    <div className="relative w-full border border-gray-700/50 rounded-3xl p-6 bg-gray-800/20 shadow-inner">
      <h2 className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-4 text-xs font-light text-gray-400 tracking-wide uppercase">
        {title}
      </h2>
      {rightBadge && (
        <div className="absolute top-0 right-6 -translate-y-1/2 bg-gray-900 px-2">
          {rightBadge}
        </div>
      )}
      {children}
    </div>
  )
}
