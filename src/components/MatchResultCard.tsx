import React, { memo } from "react"
import { MatchResult } from "@/types/match"

interface MatchResultCardProps {
  readonly result: MatchResult
  readonly compact?: boolean
  readonly isLive?: boolean
  readonly onClick?: () => void
}

export function getGameIcon(gameType: string): string {
  if (!gameType) return "/assets/eightball.png"
  switch (gameType.toLowerCase()) {
    case "eightball":
      return "/assets/eightball.png"
    case "nineball":
      return "/assets/nineball.png"
    case "snooker":
      return "/assets/snooker.png"
    case "threecushion":
      return "/assets/threecushion.png"
    default:
      return "/assets/eightball.png"
  }
}

export function countryCodeToFlagEmoji(countryCode?: string | null): string {
  if (!countryCode || countryCode?.length !== 2) return ""

  return countryCode
    .toUpperCase()
    .replaceAll(/./g, (char) =>
      String.fromCodePoint(0x1f1e6 + (char.codePointAt(0) || 0) - 65)
    )
}

interface PlayerMatchDisplayProps {
  readonly winner: string
  readonly winnerScore: number
  readonly loser?: string | null
  readonly loserScore?: number | null
  readonly compact: boolean
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
  readonly locationCity?: string | null
  readonly locationCountry?: string | null
  readonly formattedTime: string
  readonly hasReplay: boolean
  readonly matchId: string
  readonly compact: boolean
  readonly isLive?: boolean
}

function LocationTimeBadge({
  locationCity,
  locationCountry,
  formattedTime,
  hasReplay,
  matchId,
  compact,
  isLive,
}: LocationTimeBadgeProps) {
  const countryFlag = locationCountry
    ? countryCodeToFlagEmoji(locationCountry)
    : null
  const hasLocation = locationCity || countryFlag

  if (compact) {
    return (
      <div className="flex items-center justify-end gap-1.5 text-[8px] text-gray-500/70 uppercase tracking-tight">
        <span className="truncate flex items-center gap-1">
          {locationCity && <span>{locationCity}</span>}
          {countryFlag && (
            <span title={locationCountry || undefined}>{countryFlag}</span>
          )}
          {hasLocation && <span>•</span>}
          <span>{formattedTime}</span>
        </span>
        {isLive && <LiveBadge compact />}
        {!isLive && hasReplay && <ReplayBadge matchId={matchId} compact />}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1.5 text-[9px] text-gray-500 uppercase tracking-tight">
      <span className="truncate flex items-center gap-1">
        {locationCity && <span>{locationCity}</span>}
        {countryFlag && (
          <span title={locationCountry || undefined}>{countryFlag}</span>
        )}
        {hasLocation && <span>•</span>}
        <span>{formattedTime}</span>
      </span>
      {isLive && <LiveBadge compact />}
      {!isLive && hasReplay && <ReplayBadge matchId={matchId} compact />}
    </div>
  )
}

interface ReplayBadgeProps {
  readonly matchId: string
  readonly compact: boolean
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

interface LiveBadgeProps {
  readonly compact: boolean
}

function LiveBadge({ compact }: LiveBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm bg-red-600 text-white uppercase font-semibold tracking-wide leading-none ${compact ? "text-[8px] px-1 py-0.5" : "text-[9px] px-1.5 py-0.5"}`}
    >
      LIVE
    </span>
  )
}

function MatchResultCardComponent({
  result,
  compact = false,
  isLive = false,
  onClick,
}: MatchResultCardProps) {
  const formattedTime = new Date(result.timestamp).toLocaleTimeString([], {
    hour: "numeric",
  })

  const content = (
    <>
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex-shrink-0">
          <img
            src={getGameIcon(result.gameType)}
            alt=""
            className={compact ? "w-4 h-4" : "w-5 h-5"}
          />
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
        </div>
      </div>
      <LocationTimeBadge
        locationCity={result.locationCity}
        locationCountry={result.locationCountry}
        formattedTime={formattedTime}
        hasReplay={result.hasReplay}
        matchId={result.id}
        compact={compact}
        isLive={isLive}
      />
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer text-left ${compact ? "px-1 py-0.5" : "py-1 px-2"} gap-4`}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={`flex items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 ${compact ? "px-1 py-0.5" : "py-1 px-2"} gap-4`}
    >
      {content}
    </div>
  )
}

export const MatchResultCard = memo(MatchResultCardComponent, (prev, next) => {
  return (
    prev.result.id === next.result.id &&
    prev.compact === next.compact &&
    prev.isLive === next.isLive &&
    prev.onClick === next.onClick
  )
})

export default MatchResultCard
