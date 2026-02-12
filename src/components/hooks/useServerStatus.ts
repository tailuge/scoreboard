import { useState, useCallback, useEffect } from "react"
export interface ServerStatusState {
  serverStatus: string | null
  isOnline: boolean
  isConnecting: boolean
}

export function useServerStatus(statusPage: string) {
  const [state, setState] = useState<ServerStatusState>({
    serverStatus: null,
    isOnline: false,
    isConnecting: true,
  })

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
  }, [statusPage])

  useEffect(() => {
    checkServerStatus()
  }, [checkServerStatus])

  return { ...state }
}
