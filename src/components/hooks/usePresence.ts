import { useEffect, useMemo, useRef, useReducer, useState, useCallback } from "react"
import { NchanPub } from "@/nchan/nchanpub"
import { usePresenceMessages } from "@/contexts/LobbyContext"
import type { PresenceMessage } from "@/nchan/types"

export interface PresenceUser {
    userId: string
    userName: string
}

interface PresenceEntry {
    userName: string
    lastSeen: number
}

interface ServerStatusState {
    serverStatus: string | null
    isOnline: boolean
    isConnecting: boolean
}

const HEARTBEAT_INTERVAL_MS = 60000
const TTL_MS = 90000
const MAX_USERS = 50

function applyPresenceMessage(
    map: Map<string, PresenceEntry>,
    msg: PresenceMessage
): void {
    const { type, userId, userName, timestamp } = msg
    const lastSeen = timestamp ?? Date.now()

    if (type === "leave") {
        map.delete(userId)
    } else {
        map.set(userId, { userName, lastSeen })
    }
}

function getOnlineUsers(map: Map<string, PresenceEntry>): PresenceUser[] {
    const now = Date.now()
    const users: PresenceUser[] = []

    for (const [userId, entry] of map) {
        if (now - entry.lastSeen <= TTL_MS) {
            users.push({ userId, userName: entry.userName })
        }
    }

    users.sort((a, b) => {
        const aLastSeen = map.get(a.userId)?.lastSeen ?? 0
        const bLastSeen = map.get(b.userId)?.lastSeen ?? 0
        return bLastSeen - aLastSeen
    })

    return users.slice(0, MAX_USERS)
}

export function usePresence(
    userId: string,
    userName: string = "Anonymous",
    statusPage: string = "/api/connected"
) {
    const { lastMessage } = usePresenceMessages()
    const mapRef = useRef<Map<string, PresenceEntry>>(new Map())
    const pubRef = useRef<NchanPub | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const [updateCount, forceUpdate] = useReducer((x: number) => x + 1, 0)

    const [status, setStatus] = useState<ServerStatusState>({
        serverStatus: null,
        isOnline: false,
        isConnecting: true,
    })

    if (!pubRef.current) {
        pubRef.current = new NchanPub("lobby")
    }

    const checkServerStatus = useCallback(async () => {
        setStatus((prev) => ({ ...prev, isConnecting: true }))
        try {
            const response = await fetch(statusPage, {
                method: "GET",
                cache: "no-store",
            })

            if (response?.type === "opaque" || response?.ok) {
                setStatus({
                    serverStatus: "Server OK",
                    isOnline: true,
                    isConnecting: false,
                })
            } else {
                setStatus({
                    serverStatus: `Server Issue: ${response.status} ${response.statusText}`,
                    isOnline: false,
                    isConnecting: false,
                })
            }
        } catch (error: any) {
            setStatus({
                serverStatus: `Server Down: ${error.message}`,
                isOnline: false,
                isConnecting: false,
            })
        }
    }, [statusPage])

    // Heartbeat and join
    useEffect(() => {
        if (!userId) return

        checkServerStatus()

        const publishHeartbeat = () => {
            pubRef.current?.publishPresence({
                type: "heartbeat",
                userId,
                userName,
                timestamp: Date.now(),
            })
        }

        pubRef.current?.publishPresence({
            type: "join",
            userId,
            userName,
            timestamp: Date.now(),
        })

        intervalRef.current = setInterval(publishHeartbeat, HEARTBEAT_INTERVAL_MS)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
            pubRef.current?.publishPresence({
                type: "leave",
                userId,
                userName,
                timestamp: Date.now(),
            })
        }
    }, [userId, userName, checkServerStatus])

    // Listen for incoming messages
    useEffect(() => {
        if (!lastMessage) return
        applyPresenceMessage(mapRef.current, lastMessage)
        forceUpdate()
    }, [lastMessage])

    const users = useMemo(() => {
        return getOnlineUsers(mapRef.current)
    }, [updateCount])

    return {
        users,
        totalUsers: users.length,
        ...status,
        refreshStatus: checkServerStatus,
    }
}
