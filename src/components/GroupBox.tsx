// src/components/GroupBox.tsx
import React from "react"

type GroupBoxProps = {
  readonly title: string
  readonly children: React.ReactNode
  readonly rightBadge?: React.ReactNode
  readonly leftBadge?: React.ReactNode
}

export function GroupBox({ title, children, rightBadge, leftBadge }: GroupBoxProps) {
  const maskImage = `
    linear-gradient(to right, 
      ${
        leftBadge
          ? "black 10px, transparent 20px, transparent 150px, black 160px"
          : "black 0%"
      },
      black calc(50% - 80px), 
      transparent 50%, 
      black calc(50% + 80px), 
      ${
        rightBadge
          ? "black calc(100% - 230px), transparent calc(100% - 220px), transparent calc(100% - 30px), black calc(100% - 20px)"
          : "black 100%"
      }
    ) top / 100% 24px no-repeat,
    linear-gradient(black, black) bottom / 100% calc(100% - 24px) no-repeat
  `

  return (
    <div className="relative w-full rounded-3xl p-6 bg-gray-800/20 shadow-inner">
      {/* 
        Smoothly fading border mask.
        A separate div for the border allows masking it without affecting the content inside.
      */}
      <div
        className="absolute inset-0 border border-gray-700/50 rounded-3xl pointer-events-none"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      {leftBadge && (
        <div className="absolute top-0 left-6 -translate-y-1/2">
          {leftBadge}
        </div>
      )}

      <h2 className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-light text-gray-400 tracking-wide uppercase pointer-events-none">
        {title}
      </h2>

      {rightBadge && (
        <div className="absolute top-0 right-6 -translate-y-1/2">
          {rightBadge}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}