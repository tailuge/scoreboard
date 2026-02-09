import Link from "next/link"

const RED_BALL_OPTIONS = [3, 6, 15] as const
const RACE_TO_OPTIONS = [3, 5] as const

type GameButtonOptionsProps = {
  readonly baseUrl: string
  readonly isInternal: boolean
}

export function RedBallButtons({
  baseUrl,
  isInternal,
}: GameButtonOptionsProps) {
  return (
    <div className="flex gap-1 justify-center h-6">
      {RED_BALL_OPTIONS.map((reds) => {
        const href = `${baseUrl}&reds=${reds}`
        if (isInternal) {
          return (
            <Link
              key={reds}
              href={href}
              className="w-6 h-6 flex items-center justify-center bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors"
              aria-label={`Snooker with ${reds} red balls`}
            >
              {reds}
            </Link>
          )
        }
        return (
          <a
            key={reds}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors"
            aria-label={`Snooker with ${reds} red balls`}
          >
            {reds}
          </a>
        )
      })}
    </div>
  )
}

export function RaceToButtons({ baseUrl, isInternal }: GameButtonOptionsProps) {
  return (
    <div className="flex gap-1 justify-center h-6">
      {RACE_TO_OPTIONS.map((raceTo) => {
        const href = `${baseUrl}&raceTo=${raceTo}`
        if (isInternal) {
          return (
            <Link
              key={raceTo}
              href={href}
              className="px-1.5 h-6 flex items-center justify-center bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition-colors"
              aria-label={`Race to ${raceTo}`}
            >
              To:{raceTo}
            </Link>
          )
        }
        return (
          <a
            key={raceTo}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-1.5 h-6 flex items-center justify-center bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition-colors"
            aria-label={`Race to ${raceTo}`}
          >
            To:{raceTo}
          </a>
        )
      })}
    </div>
  )
}

export function ButtonOptionsPlaceholder() {
  return <div className="h-6" />
}
