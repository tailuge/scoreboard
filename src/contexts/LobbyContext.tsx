import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { NchanSub } from "@/nchan/nchansub"
import {
  parseNchanMessage,
  isLobbyMessage,
  isPresenceMessage,
  type LobbyMessage,
  type PresenceMessage,
} from "@/nchan/types"

interface LobbyContextType {
  lastMessage: any // Legacy: for backward compatibility
  lastLobbyMessage: LobbyMessage | null
  lastPresenceMessage: PresenceMessage | null
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined)

export function LobbyProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [lastMessage, setLastMessage] = useState<any>(null) // Legacy state
  const [lastLobbyMessage, setLastLobbyMessage] = useState<LobbyMessage | null>(
    null
  )
  const [lastPresenceMessage, setLastPresenceMessage] =
    useState<PresenceMessage | null>(null)

  useEffect(() => {
    const lobbySub = new NchanSub(
      "lobby",
      (msg) => {
        try {
          // Parse and route the message
          const parsed = parseNchanMessage(msg)

          if (!parsed) {
            return // Invalid message
          }

          // Route based on message type
          if (isLobbyMessage(parsed)) {
            setLastLobbyMessage(parsed)
            // Also update legacy state for backward compatibility
            setLastMessage(parsed)
          }
        } catch {
          // Ignore non-JSON messages or handle them if necessary
        }
      },
      "lobby"
    )

    const presenceSub = new NchanSub(
      "lobby",
      (msg) => {
        try {
          const parsed = parseNchanMessage(msg)

          if (!parsed) {
            return
          }

          if (isPresenceMessage(parsed)) {
            setLastPresenceMessage(parsed)
          }
        } catch {
          // Ignore non-JSON messages or handle them if necessary
        }
      },
      "presence"
    )

    lobbySub.start()
    presenceSub.start()
    return () => {
      lobbySub.stop()
      presenceSub.stop()
    }
  }, [])

  const value = useMemo(
    () => ({ lastMessage, lastLobbyMessage, lastPresenceMessage }),
    [lastMessage, lastLobbyMessage, lastPresenceMessage]
  )

  return <LobbyContext.Provider value={value}>{children}</LobbyContext.Provider>
}

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useLobbyMessages() instead
 */
export function useLobbyContext() {
  const context = useContext(LobbyContext)
  if (context === undefined) {
    throw new Error("useLobbyContext must be used within a LobbyProvider")
  }
  return context
}

/**
 * Hook to access lobby messages (match events, table updates, etc.)
 */
export function useLobbyMessages() {
  const context = useContext(LobbyContext)
  if (context === undefined) {
    throw new Error("useLobbyMessages must be used within a LobbyProvider")
  }
  return {
    lastMessage: context.lastLobbyMessage,
  }
}

/**
 * Hook to access presence messages (user join/leave/heartbeat)
 */
export function usePresenceMessages() {
  const context = useContext(LobbyContext)
  if (context === undefined) {
    throw new Error("usePresenceMessages must be used within a LobbyProvider")
  }
  return {
    lastMessage: context.lastPresenceMessage,
  }
}
