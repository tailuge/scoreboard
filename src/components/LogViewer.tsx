"use client"

import { useState, useEffect } from "react"
import { detectOS, detectBrowser, osIcon, browserIcon } from "@/utils/ua"
import { localeToFlag } from "@/utils/locale"
import type { SessionEntry } from "@/types/client-log"

const TYPE_COLORS: Record<string, string> = {
  error: "red",
  warn: "orange",
  uncaught: "red",
  promise: "red",
}

function getTypeColor(type: string) {
  return TYPE_COLORS[type] || "blue"
}

function SessionItem({
  session,
  selected,
  onSelect,
  mounted,
}: {
  readonly session: SessionEntry
  readonly selected: boolean
  readonly onSelect: () => void
  readonly mounted: boolean
}) {
  const os = detectOS(session.ua)
  const browser = detectBrowser(session.ua)
  const region = session.region
  const city = session.city
  const country = session.country

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 6px",
          background: selected ? "#222" : "transparent",
          border: "none",
          borderBottom: "1px solid #333",
          cursor: "pointer",
          color: "white",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: "bold" }}>
            {session.sid}
          </div>
          <div style={{ fontSize: "12px", color: "white" }}>
            {mounted
              ? new Date(session.ts).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : ""}
          </div>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "white",
            display: "flex",
            gap: "4px",
            marginTop: "2px",
            flexWrap: "wrap",
          }}
        >
          {os === "Unknown" ? null : (
            <span>
              {osIcon(os)} {os}
            </span>
          )}
          {browser === "Unknown" ? null : (
            <span>
              {browserIcon(browser)} {browser}
            </span>
          )}
          {country ? <span>{localeToFlag(country)}</span> : null}
          {city ? <span>{decodeURIComponent(city)}</span> : null}
          {region ? <span style={{ color: "white" }}>({region})</span> : null}
          {session.version ? (
            <span style={{ color: "#ddd" }}>v{session.version}</span>
          ) : null}
          {session.origin ? (
            <span style={{ color: "#bbb", fontSize: "10px" }}>
              {session.origin.replace(/^https?:\/\//, "")}
            </span>
          ) : null}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "#bbb",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: "2px",
          }}
        >
          {session.ua}
        </div>
      </button>
    </li>
  )
}

interface LogViewerProps {
  readonly sessions: readonly SessionEntry[]
}

export default function LogViewer({ sessions }: LogViewerProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const session = sessions.find((s) => s.sid === selected)

  return (
    <>
      <div
        style={{
          width: "300px",
          borderRight: "1px solid #333",
          overflowY: "auto",
          padding: "10px",
          color: "white",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
          Sessions ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <p>No logs yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sessions.map((s) => (
              <SessionItem
                key={s.sid}
                session={s}
                selected={selected === s.sid}
                onSelect={() => setSelected(s.sid)}
                mounted={mounted}
              />
            ))}
          </ul>
        )}
      </div>
      <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {session ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "14px", color: "white" }}>
                Logs for {session.sid.slice(0, 8)}
              </h3>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    JSON.stringify(session, null, 2)
                  )
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  background: "#444",
                  color: "white",
                  border: "1px solid #666",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Copy
              </button>
            </div>
            <pre
              style={{
                fontSize: "11px",
                whiteSpace: "pre-wrap",
                color: "white",
              }}
            >
              {session.logs.map((log, i) => (
                <div key={`${log.ts}-${i}`} style={{ marginBottom: "12px" }}>
                  <div>
                    <span style={{ color: "white" }}>
                      [{mounted ? new Date(log.ts).toLocaleTimeString() : ""}]
                    </span>{" "}
                    <span
                      style={{
                        fontWeight: "bold",
                        color: getTypeColor(log.type),
                      }}
                    >
                      {log.type}
                    </span>{" "}
                    {log.message}
                  </div>
                  {log.stack ? (
                    <div
                      style={{
                        color: "white",
                        fontSize: "11px",
                        marginTop: "4px",
                      }}
                    >
                      {log.stack}
                    </div>
                  ) : null}
                </div>
              ))}
            </pre>
          </>
        ) : (
          <p>Select a session to view logs</p>
        )}
      </div>
    </>
  )
}
