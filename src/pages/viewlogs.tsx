"use client"

import { useState, useEffect } from "react"
import LogViewer from "../components/LogViewer"
import type { SessionEntry } from "@/types/client-log"

export default function ViewLogsPage() {
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/logs")
        const data = await res.json()
        setSessions(data)
      } catch (err) {
        console.error("Failed to fetch logs:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <LogViewer sessions={sessions} />
    </div>
  )
}
