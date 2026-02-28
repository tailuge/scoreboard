// src/components/GroupBox.tsx
import React from "react"

type GroupBoxProps = {
  readonly title?: string
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
    <div className="relative w-full rounded-lg pt-8 pb-2 px-6 shadow-[0_30px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.05)] transition-all duration-500">
      <div className="absolute inset-0 rounded-lg bg-white/5 backdrop-blur-sm pointer-events-none" />
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent)]" />
      <div className="groupbox-border" />

      {title && (
        <h2 className="groupbox-title absolute top-0 left-1/2 px-4 py-1">
          {title}
        </h2>
      )}

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
