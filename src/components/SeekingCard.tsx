import React from "react"

type SeekingCardProps = {
  readonly ruleType: string
  readonly onCancel: () => void
}

export function SeekingCard({ ruleType, onCancel }: SeekingCardProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-cyan-500/40 bg-gray-800/80 p-6 text-center shadow-xl animate-in fade-in zoom-in duration-300 motion-reduce:animate-none">
      <div className="relative mx-auto mb-5 h-14 w-14">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-glow-pulse motion-reduce:animate-none"></div>
        <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-pulse motion-reduce:animate-none"></div>
        <div className="absolute inset-4 rounded-full bg-cyan-400/20 animate-ping motion-reduce:animate-none"></div>
      </div>
      <h3 className="text-xl font-bold text-white text-balance">
        Finding a {ruleType} opponent…
      </h3>
      <p className="mt-2 text-sm text-gray-300">
        Game will start when opponent is found.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-gray-600 px-6 py-2.5 text-sm font-semibold text-gray-200 transition-colors duration-200 hover:bg-gray-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 active:scale-95"
        >
          Cancel Search
        </button>
      </div>
    </div>
  )
}
