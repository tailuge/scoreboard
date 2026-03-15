import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  activeGames as deriveActiveGames,
  type ActiveGame,
  type ChallengeMessage,
  type Lobby,
  type PresenceMessage,
  MessagingClient,
} from "@tailuge/messaging"
import { useUser } from "@/contexts/UserContext"

interface MessagingContextType {
  users: PresenceMessage[]
  activeGames: ActiveGame[]
  pendingChallenge: ChallengeMessage | null
  incomingChallenge: ChallengeMessage | null
  challenge: (userId: string, ruleType: string) => Promise<string>
  acceptChallenge: (
    userId: string,
    ruleType: string,
    tableId: string
  ) => Promise<void>
  declineChallenge: (userId: string, ruleType: string) => Promise<void>
  cancelChallenge: (userId: string, ruleType: string) => Promise<void>
}

const MessagingContext = createContext<MessagingContextType | undefined>(
  undefined
)

const baseUrl =
  process.env.NEXT_PUBLIC_WEBSOCKET_HOST ||
  "https://billiards-network.onrender.com"

export function MessagingProvider({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const { userId, userName } = useUser()
  const clientRef = useRef<MessagingClient | null>(null)
  const lobbyRef = useRef<Lobby | null>(null)

  if (!clientRef.current) {
    clientRef.current = new MessagingClient({ baseUrl })
  }

  const [users, setUsers] = useState<PresenceMessage[]>([])
  const [pendingChallenge, setPendingChallenge] =
    useState<ChallengeMessage | null>(null)
  const [incomingChallenge, setIncomingChallenge] =
    useState<ChallengeMessage | null>(null)

  const activeGames = useMemo(() => deriveActiveGames(users), [users])

  useEffect(() => {
    const client = clientRef.current
    if (!client) return

    client.start()
    return () => {
      void client.stop({ isTeardown: true })
    }
  }, [])

  const attachLobbyListeners = useCallback((lobby: Lobby) => {
    const handleUsersChange = (nextUsers: PresenceMessage[]) => {
      setUsers(nextUsers)
    }

    const handleChallenge = (challenge: ChallengeMessage) => {
      switch (challenge.type) {
        case "offer":
          setIncomingChallenge(challenge)
          break
        case "accept":
          setPendingChallenge(null)
          break
        case "decline":
        case "cancel":
          setPendingChallenge(null)
          setIncomingChallenge(null)
          break
        default:
          break
      }
    }

    lobby.onUsersChange(handleUsersChange)
    lobby.onChallenge(handleChallenge)

    return () => {
      lobby.offUsersChange(handleUsersChange)
    }
  }, [])

  useEffect(() => {
    if (!userId || !userName) return
    const client = clientRef.current
    if (!client) return
    const existingLobby = lobbyRef.current
    if (existingLobby && existingLobby.currentUser.userId !== userId) {
      void existingLobby.leave({ isTeardown: true })
      lobbyRef.current = null
      setUsers([])
      setPendingChallenge(null)
      setIncomingChallenge(null)
    }

    let isActive = true
    let detachListeners: (() => void) | null = null

    const joinLobby = async () => {
      try {
        const lobby = await client.joinLobby({
          messageType: "presence",
          type: "join",
          userId,
          userName,
        })

        if (!isActive) {
          await lobby.leave()
          return
        }

        lobbyRef.current = lobby
        detachListeners = attachLobbyListeners(lobby)
      } catch (error) {
        console.error("Failed to join lobby", {
          baseUrl,
          userId,
          error,
        })
      }
    }

    void joinLobby()

    return () => {
      isActive = false
      detachListeners?.()
    }
  }, [attachLobbyListeners, userId, userName])

  const challenge = useCallback(
    async (targetUserId: string, ruleType: string) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      const tableId = await lobby.challenge(targetUserId, ruleType)
      setPendingChallenge({
        messageType: "challenge",
        type: "offer",
        challengerId: userId,
        challengerName: userName,
        recipientId: targetUserId,
        ruleType,
        tableId,
      })
      return tableId
    },
    [userId, userName]
  )

  const acceptChallenge = useCallback(
    async (targetUserId: string, ruleType: string, tableId: string) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      await lobby.acceptChallenge(targetUserId, ruleType, tableId)
      setIncomingChallenge(null)
    },
    []
  )

  const declineChallenge = useCallback(
    async (targetUserId: string, ruleType: string) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      await lobby.declineChallenge(targetUserId, ruleType)
      setIncomingChallenge(null)
    },
    []
  )

  const cancelChallenge = useCallback(
    async (targetUserId: string, ruleType: string) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      await lobby.cancelChallenge(targetUserId, ruleType)
      setPendingChallenge(null)
    },
    []
  )

  const value = useMemo(
    () => ({
      users,
      activeGames,
      pendingChallenge,
      incomingChallenge,
      challenge,
      acceptChallenge,
      declineChallenge,
      cancelChallenge,
    }),
    [
      users,
      activeGames,
      pendingChallenge,
      incomingChallenge,
      challenge,
      acceptChallenge,
      declineChallenge,
      cancelChallenge,
    ]
  )

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error("useMessaging must be used within a MessagingProvider")
  }
  return context
}
