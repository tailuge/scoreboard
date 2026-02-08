import React, { memo } from "react"
import { MatchResult } from "@/types/match"

interface MatchResultCardProps {
  readonly result: MatchResult
  readonly compact?: boolean
}

export function getGameIcon(gameType: string): string {
  if (!gameType) return "🎱"
  switch (gameType.toLowerCase()) {
    case "eightball":
      return "🎱"
    case "nineball":
      return "⑨"
    case "snooker":
      return "🔴"
    case "threecushion":
      return "⚪"
    default:
      return "🎱"
  }
}

export function countryCodeToFlagEmoji(countryCode?: string | null): string {
  if (!countryCode || countryCode.length !== 2) return ""

  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65)
    )
}

interface PlayerMatchDisplayProps {
  winner: string
  winnerScore: number
  loser?: string | null
  loserScore?: number | null
  compact: boolean
}

function PlayerMatchDisplay({
  winner,
  winnerScore,
  loser,
  loserScore,
  compact,
}: PlayerMatchDisplayProps) {
  if (!loser) {
    return (
      <span
        className={`text-gray-200 truncate ${compact ? "text-[10px] font-medium" : "text-xs font-semibold"}`}
      >
        {winner}
      </span>
    )
  }

  return (
    <>
      <span
        className={`font-medium text-gray-100 truncate ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {winner}{" "}
        <span className="text-gray-400 font-normal">({winnerScore})</span>
      </span>
      <span className="text-gray-500 text-[9px] flex-shrink-0">vs</span>
      <span
        className={`text-gray-400 truncate ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {loser} <span className="text-gray-500">({loserScore})</span>
      </span>
    </>
  )
}

interface LocationTimeBadgeProps {
  locationCity?: string | null
  locationCountry?: string | null
  formattedTime: string
  hasReplay: boolean
  matchId: string
  compact: boolean
}

function LocationTimeBadge({
  locationCity,
  locationCountry,
  formattedTime,
  hasReplay,
  matchId,
  compact,
}: LocationTimeBadgeProps) {
  const countryFlag = locationCountry
    ? countryCodeToFlagEmoji(locationCountry)
    : null
  const hasLocation = locationCity || countryFlag

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[8px] text-gray-500/70 uppercase tracking-tight">
        <span className="truncate flex items-center gap-1">
          {locationCity && <span>{locationCity}</span>}
          {countryFlag && (
            <span title={locationCountry || undefined}>{countryFlag}</span>
          )}
          {hasLocation && <span>•</span>}
          <span>{formattedTime}</span>
        </span>
        {hasReplay && <ReplayBadge matchId={matchId} compact />}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-tight">
      <span className="truncate flex items-center gap-1">
        {locationCity && <span>{locationCity}</span>}
        {countryFlag && (
          <span title={locationCountry || undefined}>{countryFlag}</span>
        )}
        {hasLocation && <span>•</span>}
        <span>{formattedTime}</span>
      </span>
      {hasReplay && <ReplayBadge matchId={matchId} compact />}
    </div>
  )
}

interface ReplayBadgeProps {
  matchId: string
  compact: boolean
}

function ReplayBadge({ matchId, compact }: ReplayBadgeProps) {
  return (
    <a
      href={`/api/match-replay?id=${matchId}`}
      target="_blank"
      rel="noreferrer"
      title="Watch replay"
      className={`inline-flex items-center rounded-sm bg-blue-600 text-white uppercase font-semibold tracking-wide leading-none transition-colors hover:bg-blue-500 ${compact ? "text-[8px] px-1 py-0.5" : "text-[9px] px-1.5 py-0.5"}`}
    >
      REPLAY
    </a>
  )
}

function MatchResultCardComponent({
  result,
  compact = false,
}: MatchResultCardProps) {
  const formattedTime = new Date(result.timestamp).toLocaleTimeString([], {
    hour: "numeric",
  })

  return (
    <div
      className={`flex items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 ${compact ? "px-1 py-0.5" : "py-1 px-2"} gap-4`}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex-shrink-0">
          <span
            className={
              compact ? "scale-75 origin-left inline-block" : "text-lg"
            }
          >
            {getGameIcon(result.gameType)}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <PlayerMatchDisplay
              winner={result.winner}
              winnerScore={result.winnerScore}
              loser={result.loser}
              loserScore={result.loserScore}
              compact={compact}
            />
          </div>
          <LocationTimeBadge
            locationCity={result.locationCity}
            locationCountry={result.locationCountry}
            formattedTime={formattedTime}
            hasReplay={result.hasReplay}
            matchId={result.id}
            compact={compact}
          />
        </div>
      </div>
      <div
        className={`flex items-center gap-1.5 font-mono ${compact ? "text-[11px]" : "text-sm"}`}
      />
    </div>
  )
}

// Optimization: memoize match result cards as they are rendered in potentially long lists
// and often fetched via polling even if they haven't changed.
export const MatchResultCard = memo(MatchResultCardComponent, (prev, next) => {
  return prev.result.id === next.result.id && prev.compact === next.compact
})

export default MatchResultCard
