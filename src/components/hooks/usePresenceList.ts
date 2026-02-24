import { useEffect, useMemo, useRef, useReducer } from "react"
import { NchanPub } from "@/nchan/nchanpub"
import { usePresenceMessages } from "@/contexts/LobbyContext"
import type { PresenceMessage } from "@/nchan/types"
import { getAnonymousName } from "@/utils/locale"

export interface PresenceUser {
  userId: string
  userName: string
  locale?: string
  originUrl?: string
}

interface PresenceEntry {
  userName: string
  locale?: string
  lastSeen: number
  originUrl?: string
}

const HEARTBEAT_INTERVAL_MS = 60000
const TTL_MS = 90000
const MAX_USERS = 50
const JOIN_DELAY_MS = 100

function applyPresenceMessage(
  map: Map<string, PresenceEntry>,
  msg: PresenceMessage
): void {
  const { type, userId, userName, locale, timestamp, originUrl } = msg
  const lastSeen = timestamp ?? Date.now()

  if (type === "leave") {
    map.delete(userId)
  } else {
    map.set(userId, { userName, locale, lastSeen, originUrl })
  }
}

function getOnlineUsers(map: Map<string, PresenceEntry>): PresenceUser[] {
  const now = Date.now()
  const users: PresenceUser[] = []

  for (const [userId, entry] of map) {
    if (now - entry.lastSeen > TTL_MS) {
      map.delete(userId)
      continue
    }
    users.push({
      userId,
      userName: entry.userName,
      locale: entry.locale,
      originUrl: entry.originUrl,
    })
  }

  users.sort((a, b) => {
    const aLastSeen = map.get(a.userId)?.lastSeen ?? 0
    const bLastSeen = map.get(b.userId)?.lastSeen ?? 0
    return bLastSeen - aLastSeen
  })

  return users
}

export function usePresenceList(
  userId: string,
  userName?: string
): { users: PresenceUser[]; count: number } {
  const { lastMessage } = usePresenceMessages()
  const mapRef = useRef<Map<string, PresenceEntry>>(new Map())
  const pubRef = useRef<NchanPub | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [updateCount, forceUpdate] = useReducer((x: number) => x + 1, 0)

  if (!pubRef.current) {
    pubRef.current = new NchanPub("lobby")
  }

  const effectiveUserName =
    userName ?? getAnonymousName(globalThis.navigator?.language)
  const originUrl = globalThis.location?.host
    ? `origin:${globalThis.location.host}`
    : ""

  useEffect(() => {
    if (!userId) return

    const publishHeartbeat = () => {
      pubRef.current?.publishPresence({
        type: "heartbeat",
        userId,
        userName: effectiveUserName,
        locale: navigator.language,
        originUrl,
        timestamp: Date.now(),
      })
    }

    const joinTimeoutId = setTimeout(() => {
      pubRef.current?.publishPresence({
        type: "join",
        userId,
        userName: effectiveUserName,
        locale: navigator.language,
        originUrl,
        timestamp: Date.now(),
      })
    }, JOIN_DELAY_MS)

    intervalRef.current = setInterval(publishHeartbeat, HEARTBEAT_INTERVAL_MS)

    return () => {
      clearTimeout(joinTimeoutId)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [userId, effectiveUserName, originUrl])

  useEffect(() => {
    if (!lastMessage) return

    applyPresenceMessage(mapRef.current, lastMessage)
    forceUpdate()
  }, [lastMessage])

  const { users, count } = useMemo(() => {
    const onlineUsers = getOnlineUsers(mapRef.current)
    return {
      users: onlineUsers.slice(0, MAX_USERS),
      count: onlineUsers.length,
    }
  }, [updateCount])

  return { users, count }
}
