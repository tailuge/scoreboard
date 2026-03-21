import { useCallback, useEffect, useState } from "react"
import {
  type ChallengeMessage,
  type PresenceMessage,
  type RematchInfo,
} from "@tailuge/messaging"
import { useMessaging } from "@/contexts/MessagingContext"
import { GameUrl, type RematchParam } from "@/utils/GameUrl"
import { useUser } from "@/contexts/UserContext"

export function useChallengeFlow() {
  const { userId, userName } = useUser()
  const {
    pendingChallenge,
    incomingChallenge,
    acceptedChallenge,
    challenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    updatePresence,
    clearAcceptedChallenge,
  } = useMessaging()

  const [rematchParam, setRematchParam] = useState<RematchParam | null>(null)
  const [isChallengeBusy, setIsChallengeBusy] = useState(false)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [isAutoAccepting, setIsAutoAccepting] = useState(false)

  // Initialize rematch param from URL on mount
  useEffect(() => {
    const param = GameUrl.parseRematch(globalThis.location.search)
    if (param) {
      setRematchParam(param)
      console.log("[challenge] Rematch parameter detected", param)
    }
  }, [])

  const openGameWindow = useCallback(
    (
      tableId: string,
      ruleType: string,
      isCreator: boolean,
      rematch?: RematchParam
    ) => {
      if (!userId || !userName) return
      const target = GameUrl.create({
        tableId,
        userName,
        userId,
        ruleType,
        isCreator,
        rematch,
      })
      console.log("[challenge] Redirecting to game", {
        tableId,
        ruleType,
        isCreator,
        target: target.toString(),
      })
      globalThis.location.href = target.toString()
    },
    [userId, userName]
  )

  const handleSendChallenge = useCallback(
    async (targetUserId: string, ruleType: string, rematch?: RematchInfo) => {
      setIsChallengeBusy(true)
      setChallengeError(null)
      try {
        const tableId = await challenge(targetUserId, ruleType, rematch)
        console.log("[challenge] Offer sent", { tableId, targetUserId, ruleType })
      } catch (error) {
        console.error("Failed to send challenge", error)
        setChallengeError("Failed to send challenge. Please try again.")
      } finally {
        setIsChallengeBusy(false)
      }
    },
    [challenge]
  )

  const handleAcceptChallenge = useCallback(async () => {
    if (!incomingChallenge || !incomingChallenge.tableId) return
    setIsChallengeBusy(true)
    setChallengeError(null)
    try {
      await acceptChallenge(
        incomingChallenge.challengerId,
        incomingChallenge.ruleType,
        incomingChallenge.tableId
      )
      await updatePresence({
        tableId: incomingChallenge.tableId,
        ruleType: incomingChallenge.ruleType,
        opponentId: incomingChallenge.challengerId,
      })

      // If this was a rematch, we might want to propagate the rematch info
      // but usually the "rematch" param in the URL is what we care about for the NEXT game.
      // However, if we just accepted a rematch, we are now in the game.
      openGameWindow(
        incomingChallenge.tableId,
        incomingChallenge.ruleType,
        false,
        rematchParam || undefined
      )
    } catch (error) {
      console.error("Failed to accept challenge", error)
      setChallengeError("Failed to accept challenge. Please try again.")
      setIsAutoAccepting(false)
    } finally {
      setIsChallengeBusy(false)
    }
  }, [
    acceptChallenge,
    incomingChallenge,
    openGameWindow,
    updatePresence,
    rematchParam,
  ])

  const handleDeclineChallenge = useCallback(async () => {
    if (!incomingChallenge) return
    setIsChallengeBusy(true)
    try {
      await declineChallenge(
        incomingChallenge.challengerId,
        incomingChallenge.ruleType
      )
    } catch (error) {
      console.error("Failed to decline challenge", error)
    } finally {
      setIsChallengeBusy(false)
    }
  }, [declineChallenge, incomingChallenge])

  const handleCancelChallenge = useCallback(async () => {
    if (!pendingChallenge) return
    setIsChallengeBusy(true)
    try {
      await cancelChallenge(
        pendingChallenge.recipientId,
        pendingChallenge.ruleType
      )
    } catch (error) {
      console.error("Failed to cancel challenge", error)
    } finally {
      setIsChallengeBusy(false)
    }
  }, [cancelChallenge, pendingChallenge])

  // Auto-accept logic: if we have a rematch param and an incoming challenge matches it.
  useEffect(() => {
    if (rematchParam && incomingChallenge && !isAutoAccepting) {
      const isMatch =
        incomingChallenge.challengerId === rematchParam.opponentId &&
        incomingChallenge.ruleType === rematchParam.ruleType

      if (isMatch) {
        console.log("[challenge] Auto-accepting matching rematch challenge")
        setIsAutoAccepting(true)
        void handleAcceptChallenge()
      }
    }
  }, [rematchParam, incomingChallenge, isAutoAccepting, handleAcceptChallenge])

  // Handle accepted challenge (we were the challenger)
  useEffect(() => {
    if (!acceptedChallenge || !userId) return

    const openAcceptedGame = async () => {
      if (!acceptedChallenge.tableId) return

      await updatePresence({
        tableId: acceptedChallenge.tableId,
        ruleType: acceptedChallenge.ruleType,
        opponentId: acceptedChallenge.recipientId,
      })

      openGameWindow(
        acceptedChallenge.tableId,
        acceptedChallenge.ruleType,
        true,
        rematchParam || undefined
      )
      clearAcceptedChallenge()
    }

    void openAcceptedGame()
  }, [
    acceptedChallenge,
    userId,
    clearAcceptedChallenge,
    openGameWindow,
    updatePresence,
    rematchParam,
  ])

  return {
    pendingChallenge,
    incomingChallenge,
    rematchParam,
    isChallengeBusy,
    challengeError,
    isAutoAccepting,
    sendChallenge: handleSendChallenge,
    acceptChallenge: handleAcceptChallenge,
    declineChallenge: handleDeclineChallenge,
    cancelChallenge: handleCancelChallenge,
    clearError: () => setChallengeError(null),
  }
}
