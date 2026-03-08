"use client"

import { useState } from "react"
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
}: {
  readonly session: SessionEntry
  readonly selected: boolean
  readonly onSelect: () => void
}) {
  const os = detectOS(session.ua)
  const browser = detectBrowser(session.ua)
  const region = session.region || session.logs[0]?.region
  const city = session.city
  const country = session.country

  return (
    <li>
      <button
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
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "bold" }}>
            {session.sid}
          </div>
          <div style={{ fontSize: "10px", color: "white" }}>
            {new Date(session.ts).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "white",
            display: "flex",
            gap: "4px",
            marginTop: "2px",
          }}
        >
          <span>
            {osIcon(os)} {os}
          </span>
          <span>
            {browserIcon(browser)} {browser}
          </span>
        </div>
        <div
          style={{
            fontSize: "9px",
            color: "white",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: "2px",
          }}
        >
          {session.ua}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "white",
            marginTop: "2px",
            display: "flex",
            gap: "4px",
          }}
        >
          {country ? <span>{localeToFlag(country)}</span> : null}
          {city ? <span>{city}</span> : null}
          {region ? <span style={{ color: "white" }}>({region})</span> : null}
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
        <h3 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
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
              />
            ))}
          </ul>
        )}
      </div>
      <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {session ? (
          <>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
              Logs for {session.sid.slice(0, 8)}
            </h3>
            <pre style={{ fontSize: "11px", whiteSpace: "pre-wrap" }}>
              {session.logs.map((log, i) => (
                <div key={`${log.ts}-${i}`} style={{ marginBottom: "12px" }}>
                  <div>
                    <span style={{ color: "#eee" }}>
                      [{new Date(log.ts).toLocaleTimeString()}]
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
                        color: "#eee",
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
