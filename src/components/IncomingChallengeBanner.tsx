import React from "react"

type IncomingChallengeBannerProps = {
  readonly userName: string
  readonly onClick: () => void
}

export function IncomingChallengeBanner({
  userName,
  onClick,
}: IncomingChallengeBannerProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-800/70 border border-red-500/40 text-[12px] font-bold text-white-400 hover:bg-red-500/40 transition-all animate-pulse"
      title={`Challenge from ${userName}`}
    >
      <span className="text-sm">⚔️</span>
      <span>Challenge from {userName}</span>
    </button>
  )
}
