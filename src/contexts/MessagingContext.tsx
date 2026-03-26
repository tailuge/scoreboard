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
  type RematchInfo,
  type ChatMessage,
  MessagingClient,
} from "@tailuge/messaging"
import { useUser } from "@/contexts/UserContext"

interface MessagingContextType {
  users: PresenceMessage[]
  activeGames: ActiveGame[]
  pendingChallenge: ChallengeMessage | null
  incomingChallenge: ChallengeMessage | null
  acceptedChallenge: ChallengeMessage | null
  chats: Record<string, ChatMessage[]>
  unreadUsers: string[]
  challenge: (
    userId: string,
    ruleType: string,
    rematch?: RematchInfo
  ) => Promise<string>
  acceptChallenge: (
    userId: string,
    ruleType: string,
    tableId: string
  ) => Promise<void>
  declineChallenge: (userId: string, ruleType: string) => Promise<void>
  cancelChallenge: (userId: string, ruleType: string) => Promise<void>
  updatePresence: (update: Partial<PresenceMessage>) => Promise<void>
  clearAcceptedChallenge: () => void
  sendChat: (recipientId: string, text: string) => Promise<void>
  markChatAsRead: (userId: string) => void
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
  const [acceptedChallenge, setAcceptedChallenge] =
    useState<ChallengeMessage | null>(null)
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({})
  const [unreadUsers, setUnreadUsers] = useState<string[]>([])

  const activeGames = useMemo(() => deriveActiveGames(users), [users])

  useEffect(() => {
    const client = clientRef.current
    if (!client) return

    client.start()
    return () => {
      client.stop({ isTeardown: true })
    }
  }, [])

  const attachLobbyListeners = useCallback(
    (lobby: Lobby) => {
      let active = true

      const handleUsersChange = (nextUsers: PresenceMessage[]) => {
        if (!active) return
        setUsers(nextUsers)
      }

      const handleChallenge = (challenge: ChallengeMessage) => {
        if (!active) return
        switch (challenge.type) {
          case "offer":
            setIncomingChallenge(challenge)
            break
          case "accept":
            setPendingChallenge(null)
            setAcceptedChallenge(challenge)
            break
          case "decline":
          case "cancel":
            setPendingChallenge(null)
            setIncomingChallenge(null)
            setAcceptedChallenge(null)
            break
          default:
            break
        }
      }

      const handleChat = (chat: ChatMessage) => {
        if (!active) return
        setChats((prev) => {
          const otherId =
            chat.senderId === userId ? chat.recipientId : chat.senderId
          const existing = prev[otherId] || []
          // Avoid duplicate messages if the server echoes them back.
          // We check for sender, text and a timestamp within a 5-second window
          // to account for client/server time differences while still preventing duplicates.
          const isDuplicate = existing.some(
            (msg) =>
              msg.senderId === chat.senderId &&
              msg.text === chat.text &&
              Math.abs((msg.meta?.ts || 0) - (chat.meta?.ts || 0)) < 5000
          )
          if (isDuplicate) return prev

          return {
            ...prev,
            [otherId]: [...existing, chat],
          }
        })
        if (chat.senderId !== userId) {
          setUnreadUsers((prev) =>
            prev.includes(chat.senderId) ? prev : [...prev, chat.senderId]
          )
        }
      }

      lobby.onUsersChange(handleUsersChange)
      lobby.onChallenge(handleChallenge)
      lobby.onChat(handleChat)

      return () => {
        active = false
        lobby.offUsersChange(handleUsersChange)
      }
    },
    [userId]
  )

  useEffect(() => {
    if (!userId || !userName) return
    const client = clientRef.current
    if (!client) return
    const existingLobby = lobbyRef.current
    if (existingLobby && existingLobby.currentUser.userId !== userId) {
      existingLobby.leave({ isTeardown: true })
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
    async (targetUserId: string, ruleType: string, rematch?: RematchInfo) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      const tableId = await lobby.challenge(targetUserId, ruleType, rematch)
      setPendingChallenge({
        messageType: "challenge",
        type: "offer",
        challengerId: userId,
        challengerName: userName,
        recipientId: targetUserId,
        ruleType,
        tableId,
        rematch,
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

  const updatePresence = useCallback(
    async (update: Partial<PresenceMessage>) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      await lobby.updatePresence(update)
    },
    []
  )

  const clearAcceptedChallenge = useCallback(() => {
    setAcceptedChallenge(null)
  }, [])

  const sendChat = useCallback(
    async (recipientId: string, text: string) => {
      const lobby = lobbyRef.current
      if (!lobby) {
        throw new Error("Lobby not initialized")
      }
      await lobby.sendChat(recipientId, text)

      // Manually add the sent message to the local state to ensure it shows up immediately
      // and handles cases where the server doesn't echo back.
      const sentMessage: ChatMessage = {
        messageType: "chat",
        senderId: userId,
        recipientId,
        text,
        meta: {
          ts: Date.now(),
          ua: "",
          ip: "",
          origin: "",
          method: "",
          country: "",
        },
      }

      setChats((prev) => {
        const existing = prev[recipientId] || []
        return {
          ...prev,
          [recipientId]: [...existing, sentMessage],
        }
      })
    },
    [userId]
  )

  const markChatAsRead = useCallback((targetUserId: string) => {
    setUnreadUsers((prev) => prev.filter((id) => id !== targetUserId))
  }, [])

  const value = useMemo(
    () => ({
      users,
      activeGames,
      pendingChallenge,
      incomingChallenge,
      acceptedChallenge,
      chats,
      unreadUsers,
      challenge,
      acceptChallenge,
      declineChallenge,
      cancelChallenge,
      updatePresence,
      clearAcceptedChallenge,
      sendChat,
      markChatAsRead,
    }),
    [
      users,
      activeGames,
      pendingChallenge,
      incomingChallenge,
      acceptedChallenge,
      chats,
      unreadUsers,
      challenge,
      acceptChallenge,
      declineChallenge,
      cancelChallenge,
      updatePresence,
      clearAcceptedChallenge,
      sendChat,
      markChatAsRead,
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
