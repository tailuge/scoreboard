import { useState, useCallback, useEffect } from "react"
import { NchanPub } from "../../nchan/nchanpub"
import { NchanSub } from "../../nchan/nchansub"
import { logger } from "../../utils/logger"

export interface ServerStatusState {
  serverStatus: string | null
  isOnline: boolean
  isConnecting: boolean
  activeUsers: number | null
}

export function useServerStatus(statusPage: string) {
  const [state, setState] = useState<ServerStatusState>({
    serverStatus: null,
    isOnline: false,
    isConnecting: true,
    activeUsers: null,
  })

  const fetchActiveUsers = useCallback(async () => {
    try {
      const activeUsers = await new NchanPub("lobby").get()
      logger.log("active users:", activeUsers)
      setState((prev) => ({ ...prev, activeUsers }))
    } catch {
      setState((prev) => ({ ...prev, activeUsers: null }))
    }
  }, [])

  const registerConnected = useCallback(async () => {
    try {
      const response = await fetch("/api/connected", {
        method: "GET",
      })
      if (!response.ok) {
        logger.log("Failed to register connection")
      }
    } catch (error) {
      logger.log("Error registering connection:", error)
    }
  }, [])

  const checkServerStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true }))

    try {
      const response = await fetch(statusPage, {
        method: "GET",
        cache: "no-store",
      })

      if (response?.type === "opaque" || response?.ok) {
        setState((prev) => ({
          ...prev,
          serverStatus: "Server OK",
          isOnline: true,
        }))
        await registerConnected()
        fetchActiveUsers()
      } else {
        setState((prev) => ({
          ...prev,
          serverStatus: `Server Issue: ${response.status} ${response.statusText}`,
          isOnline: false,
        }))
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        serverStatus: `Server Down: ${error.message}`,
        isOnline: false,
      }))
    } finally {
      setState((prev) => ({ ...prev, isConnecting: false }))
    }
  }, [statusPage, registerConnected, fetchActiveUsers])

  useEffect(() => {
    checkServerStatus()
  }, [checkServerStatus])

  useEffect(() => {
    const sub = new NchanSub("lobby", (e) => {
      try {
        const data = JSON.parse(e)
        if (data?.action === "connected") {
          fetchActiveUsers()
        }
      } catch {
        // Ignore non-json or invalid messages
      }
    })
    sub.start()
    return () => sub.stop()
  }, [fetchActiveUsers])

  return { ...state, fetchActiveUsers }
}
