import React, { useEffect, useRef, useState } from "react"
import { ShareIcon } from "@heroicons/react/24/solid"

type ServerStats = {
  uptime: {
    seconds: number
    days: number
    hours: number
    mins: number
  }
  ip_cache: Record<string, string>
}

type ParsedCountry = {
  code: string
  count: number
}

const STATS_URL = "https://billiards-network.onrender.com/api/stats"
const GITHUB_URL = "https://github.com/tailuge/billiards"

function parseCountryData(ipCache: Record<string, string>): ParsedCountry[] {
  const countryCounts = new Map<string, number>()

  Object.values(ipCache).forEach((value) => {
    const parts = value.split("|")
    if (parts.length >= 1) {
      const countryCode = parts[0]
      countryCounts.set(countryCode, (countryCounts.get(countryCode) || 0) + 1)
    }
  })

  return Array.from(countryCounts.entries())
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
}

function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase()
  return code
    .split("")
    .map((char) => String.fromCodePoint(0x1f1a5 + char.charCodeAt(0)))
    .join("")
}

function formatUptime(uptime: ServerStats["uptime"]): string {
  const parts: string[] = []
  if (uptime.days > 0) parts.push(`${uptime.days}d`)
  if (uptime.hours > 0) parts.push(`${uptime.hours}h`)
  if (uptime.mins > 0) parts.push(`${uptime.mins}m`)
  if (uptime.seconds > 0 && parts.length === 0) parts.push(`${uptime.seconds}s`)
  return parts.join(" ") || "0s"
}

export function ServerStatsPopover({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !triggerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(null)
      fetch(STATS_URL)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data: ServerStats) => {
          setStats(data)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to load stats")
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setStats(null)
    }
  }, [isOpen])

  const handleShare = async () => {
    const url = globalThis.location.href
    const shareData = {
      title: "Billiards Scoreboard",
      url: url,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch (err) {
      console.error("Share failed:", err)
    }
  }

  const parsedCountries = stats ? parseCountryData(stats.ip_cache) : []

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-transparent border-none p-0 appearance-none text-inherit font-inherit cursor-pointer focus:outline-none block"
        aria-label="View server stats"
        type="button"
      >
        {children}
      </button>

      {isOpen ? (
        <dialog
          ref={popoverRef}
          open={isOpen}
          className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-1rem)] rounded-lg border bg-gray-800/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in block"
          style={{
            borderColor: "rgba(255, 255, 255, 0.15)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(6, 182, 212, 0.1)",
            zIndex: 50,
          }}
          aria-label="Online info"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
            <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
              Online Info
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Close"
              type="button"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center text-xs text-gray-400 py-4">
                Loading...
              </div>
            ) : null}

            {error ? (
              <div className="text-xs text-red-400 py-2">{error}</div>
            ) : null}

            {stats ? (
              <>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">
                    Uptime
                  </div>
                  <div className="text-sm font-mono text-cyan-300">
                    {formatUptime(stats.uptime)}
                  </div>
                </div>

                {parsedCountries.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">
                      Recent Visitors
                    </div>
                    <div className="space-y-1">
                      {parsedCountries.map(({ code, count }) => (
                        <div
                          key={code}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="flex items-center gap-2">
                            <span>{getFlagEmoji(code)}</span>
                            <span className="text-gray-400">{code}</span>
                          </span>
                          <span className="font-mono text-gray-300">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShare}
                      className="p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                      title="Share"
                      aria-label="Share"
                      type="button"
                    >
                      <ShareIcon className="h-4 w-4 text-gray-300" />
                    </button>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                      title="GitHub"
                      aria-label="GitHub"
                    >
                      <svg
                        className="h-4 w-4 text-gray-300"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.24-.601-.536-3.031.116-6.314 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 3.283.359 5.713.119 6.314.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </dialog>
      ) : null}
    </div>
  )
}
