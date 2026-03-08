"use client"

import { useState } from "react"
import { detectOS, detectBrowser } from "@/utils/ua"
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
  session: SessionEntry
  selected: boolean
  onSelect: () => void
}) {
  const os = detectOS(session.ua)
  const browser = detectBrowser(session.ua)
  const region = session.logs[0]?.region

  return (
    <li>
      <button
        onClick={onSelect}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "6px",
          background: selected ? "#e0e0e0" : "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: "bold" }}>
          {session.sid.slice(0, 8)}
        </div>
        <div style={{ fontSize: "10px", color: "#888" }}>
          {os} · {browser}
        </div>
        <div style={{ fontSize: "10px", color: "#aaa" }}>
          {new Date(session.ts).toLocaleString()}
        </div>
        {region ? (
          <div style={{ fontSize: "10px", color: "#888" }}>{region}</div>
        ) : null}
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
          borderRight: "1px solid #ccc",
          overflowY: "auto",
          padding: "10px",
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
                    <span style={{ color: "#666" }}>
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
                        color: "#666",
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
