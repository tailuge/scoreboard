// src/components/GroupBox.tsx
import React from "react"

type GroupBoxProps = {
  readonly title: string
  readonly children: React.ReactNode
  readonly rightBadge?: React.ReactNode
  readonly leftBadge?: React.ReactNode
}
export function GroupBox({ title, children, rightBadge, leftBadge }: GroupBoxProps) {

  const TITLE_GAP = 180     // fully invisible region
  const TITLE_FADE = 80    // long fade = smooth
  const TOP_BORDER_HEIGHT = 40

  const maskImage = `
  linear-gradient(to right,
    rgba(0,0,0,1) 0%,

    /* fade out */
    rgba(0,0,0,1) calc(50% - ${TITLE_GAP / 2 + TITLE_FADE}px),
    rgba(0,0,0,0) calc(50% - ${TITLE_GAP / 2}px),

    /* invisible behind title */
    rgba(0,0,0,0) calc(50% + ${TITLE_GAP / 2}px),

    /* fade back in */
    rgba(0,0,0,1) calc(50% + ${TITLE_GAP / 2 + TITLE_FADE}px),

    rgba(0,0,0,1) 100%
  )
  top / 100% ${TOP_BORDER_HEIGHT}px no-repeat,

  linear-gradient(rgba(0,0,0,1), rgba(0,0,0,1))
  bottom / 100% calc(100% - ${TOP_BORDER_HEIGHT}px) no-repeat
`

  return (
    <div className="relative w-full rounded-3xl p-6 bg-gray-800/20 shadow-inner">
      <div
        className="absolute inset-0 rounded-3xl border border-gray-700/50 pointer-events-none"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      <h2 className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2
                     text-xs font-light text-gray-400 tracking-wide uppercase
                     pointer-events-none bg-gray-900/80 px-2">
        {title}
      </h2>

      {leftBadge && (
        <div className="absolute top-0 left-6 -translate-y-1/2">
          {leftBadge}
        </div>
      )}

      {rightBadge && (
        <div className="absolute top-0 right-6 -translate-y-1/2">
          {rightBadge}
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </div>
  )
}
