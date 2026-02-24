import { countryCodeToFlagEmoji } from "@/utils/game"

interface LocationTimeBadgeProps {
  readonly locationCity?: string | null
  readonly locationCountry?: string | null
  readonly formattedTime: string
  readonly hasReplay: boolean
  readonly matchId: string
  readonly compact: boolean
  readonly isLive?: boolean
}

export function LocationTimeBadge({
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
  const textSize = compact ? "text-[9px]" : "text-[10px]"
  const textColor = compact ? "text-gray-500/70" : "text-gray-500"

  return (
    <div
      className={`flex items-center justify-end gap-1.5 ${textSize} ${textColor} tracking-tight`}
    >
      <span className="truncate flex items-center gap-1">
        <span>{formattedTime}</span>
        {hasLocation && <span>•</span>}
        {locationCity && <span>{locationCity}</span>}
        {countryFlag && (
          <span title={locationCountry || undefined}>{countryFlag}</span>
        )}
      </span>
      {isLive && <MatchBadge variant="live" compact={compact} />}
      {!isLive && hasReplay && (
        <MatchBadge variant="replay" compact={compact} matchId={matchId} />
      )}
    </div>
  )
}

type MatchBadgeVariant = "live" | "replay"

interface MatchBadgeProps {
  readonly variant: MatchBadgeVariant
  readonly compact: boolean
  readonly matchId?: string
}

function MatchBadge({ variant, compact, matchId }: MatchBadgeProps) {
  const sizeClasses = compact
    ? "text-[8px] px-1 py-0.5"
    : "text-[9px] px-1.5 py-0.5"

  if (variant === "live") {
    return (
      <span
        className={`inline-flex items-center rounded-sm bg-red-600 text-white font-semibold leading-none ${sizeClasses}`}
      >
        Live
      </span>
    )
  }

  return (
    <a
      href={`/api/match-replay?id=${matchId}`}
      target="_blank"
      rel="noreferrer"
      title="Watch replay"
      className={`inline-flex items-center rounded-sm bg-blue-600 text-white font-semibold leading-none transition-colors hover:bg-blue-500 ${sizeClasses}`}
    >
      Replay
    </a>
  )
}
