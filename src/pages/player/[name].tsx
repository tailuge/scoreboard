import React from "react"
import type { GetServerSideProps } from "next"
import Link from "next/link"
import { GroupBox } from "@/components/GroupBox"
import { GAME_TYPES } from "@/config"

type HistoryEntry = {
  date: string
  rating: number
}

interface PlayerPageProps {
  readonly name: string
  readonly ruleType: string
  readonly history: readonly HistoryEntry[]
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  params,
  query,
}) => {
  const name = params?.name as string
  const ruleType = (query?.ruleType as string) || "nineball"
  const host = req.headers.host ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const base = `${protocol}://${host}`

  try {
    const res = await fetch(
      `${base}/api/player/${encodeURIComponent(name)}?name=${encodeURIComponent(
        name
      )}&ruleType=${ruleType}`
    )
    const history = res.ok ? await res.json() : []
    return { props: { name, ruleType, history } }
  } catch {
    return { props: { name, ruleType, history: [] } }
  }
}

function EloGraph({ history }: { readonly history: readonly HistoryEntry[] }) {
  if (history.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 italic">
        {history.length === 0
          ? "No history data"
          : "Need at least 2 days of data for a graph"}
      </div>
    )
  }

  const padding = 40
  const width = 800
  const height = 400
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const ratings = history.map((h) => h.rating)
  const minRating = Math.min(...ratings) - 50
  const maxRating = Math.max(...ratings) + 50
  const range = maxRating - minRating

  const points = history
    .map((h, i) => {
      const x = padding + (i / (history.length - 1)) * chartWidth
      const y =
        padding + chartHeight - ((h.rating - minRating) / range) * chartHeight
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[600px] h-auto"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = padding + chartHeight - p * chartHeight
          const val = Math.round(minRating + p * range)
          return (
            <React.Fragment key={p}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#374151"
                strokeDasharray="4"
              />
              <text
                x={padding - 5}
                y={y + 4}
                fill="#9CA3AF"
                fontSize="12"
                textAnchor="end"
              >
                {val}
              </text>
            </React.Fragment>
          )
        })}

        {/* Date labels */}
        {history.map((h, i) => {
          if (history.length > 10 && i % Math.ceil(history.length / 10) !== 0)
            return null
          const x = padding + (i / (history.length - 1)) * chartWidth
          return (
            <text
              key={h.date}
              x={x}
              y={height - padding + 20}
              fill="#9CA3AF"
              fontSize="10"
              textAnchor="middle"
              transform={`rotate(45, ${x}, ${height - padding + 20})`}
            >
              {h.date.slice(5)}
            </text>
          )
        })}

        {/* The line */}
        <polyline
          fill="none"
          stroke="#60A5FA"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {history.map((h, i) => {
          const x = padding + (i / (history.length - 1)) * chartWidth
          const y =
            padding +
            chartHeight -
            ((h.rating - minRating) / range) * chartHeight
          return (
            <circle
              key={h.date}
              cx={x}
              cy={y}
              r="4"
              fill="#2563EB"
              className="hover:r-6 transition-all cursor-pointer"
            >
              <title>{`${h.date}: ${h.rating}`}</title>
            </circle>
          )
        })}
      </svg>
    </div>
  )
}

export default function PlayerPage({
  name,
  ruleType,
  history,
}: PlayerPageProps) {
  const gameName =
    GAME_TYPES.find((g) => g.ruleType === ruleType)?.name || ruleType

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-sans text-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light text-center mb-2 text-gray-200 tracking-wider">
          {name}
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          ELO History for {gameName}
        </p>

        <GroupBox title="Rating Over Time">
          <EloGraph history={history} />
        </GroupBox>

        <div className="mt-8">
          <GroupBox title="History Data">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700 text-left">
                  <th className="py-2">Date</th>
                  <th className="py-2 text-right">Rating</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h) => (
                  <tr key={h.date} className="border-b border-gray-800">
                    <td className="py-2 text-gray-300">{h.date}</td>
                    <td className="py-2 text-right font-mono text-blue-400">
                      {h.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GroupBox>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Link
            href="/elo"
            className="inline-block px-4 py-1 text-gray-200 no-underline rounded-lg transition-colors hover:text-white"
            style={{
              color: "rgba(220, 230, 255, 0.9)",
              backdropFilter: "blur(10px) saturate(100%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              background: "rgba(7, 27, 7, 0.724)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            }}
          >
            Back to ELO
          </Link>
          <a
            href="https://billiards.tailuge.workers.dev/lobby"
            className="inline-block px-4 py-1 text-gray-200 no-underline rounded-lg transition-colors hover:text-white"
            style={{
              color: "rgba(220, 230, 255, 0.9)",
              backdropFilter: "blur(10px) saturate(100%)",
              WebkitBackdropFilter: "blur(40px) saturate(200%)",
              background: "rgba(7, 27, 7, 0.724)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            }}
          >
            Back to Lobby
          </a>
        </div>
      </div>
    </div>
  )
}
