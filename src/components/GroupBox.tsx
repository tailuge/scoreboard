// src/components/GroupBox.tsx
import React from "react"

type GroupBoxProps = {
  readonly title: string
  readonly children: React.ReactNode
  readonly rightBadge?: React.ReactNode
  readonly leftBadge?: React.ReactNode
}

export function GroupBox({
  title,
  children,
  rightBadge,
  leftBadge,
}: GroupBoxProps) {
  return (
    <div className="relative w-full rounded-xl pt-6 pb-4 px-6 bg-[rgba(13,14,18,0.85)] shadow-inner">
      <div className="groupbox-border" />

      <h2 className="groupbox-title absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1">
        {title}
      </h2>

      {leftBadge && (
        <div className="absolute top-0 left-6 -translate-y-1/2 z-10">
          {leftBadge}
        </div>
      )}

      {rightBadge && (
        <div className="absolute top-0 right-6 -translate-y-1/2 z-20">
          {rightBadge}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
