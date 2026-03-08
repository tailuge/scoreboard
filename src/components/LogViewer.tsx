"use client"

import { useState } from "react"
import type { SessionEntry } from "@/types/client-log"

const TYPE_COLORS: Record<string, string> = {
  error: "red",
  warn: "orange",
  uncaught: "red",
  promise: "red",
}

function parseUa(ua: string) {
  if (!ua) return "Unknown"
  const uaLower = ua.toLowerCase()
  if (uaLower.includes("chrome")) return "Chrome"
  if (uaLower.includes("firefox")) return "Firefox"
  if (uaLower.includes("safari")) return "Safari"
  if (uaLower.includes("mobile")) return "Mobile"
  return ua.split(" ")[0]
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString()
}

function shortSid(sid: string) {
  return sid.slice(0, 8)
}

function getTypeColor(type: string) {
  return TYPE_COLORS[type] || "blue"
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
        <h3 style={{ margin: "0 0 10px 0" }}>Sessions ({sessions.length})</h3>
        {sessions.length === 0 ? (
          <p>No logs yet</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sessions.map((s) => (
              <li key={s.sid}>
                <button
                  onClick={() => setSelected(s.sid)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px",
                    background: selected === s.sid ? "#e0e0e0" : "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <strong>{shortSid(s.sid)}</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {parseUa(s.ua)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#999" }}>
                    {formatTime(s.ts)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {session ? (
          <>
            <h3 style={{ margin: "0 0 10px 0" }}>
              Logs for {shortSid(session.sid)}
            </h3>
            <pre style={{ fontSize: "12px", whiteSpace: "pre-wrap" }}>
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
