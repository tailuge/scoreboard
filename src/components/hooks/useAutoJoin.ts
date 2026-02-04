import { useEffect, useRef } from "react"
import { NextRouter } from "next/router"

export function useAutoJoin(
  router: NextRouter,
  isLoading: boolean,
  userId: string | null,
  userName: string | null,
  handleAutoJoin: (gameType: string) => Promise<void>
) {
  const hasHandledAutoJoin = useRef(false)

  useEffect(() => {
    if (
      isLoading ||
      !router.isReady ||
      hasHandledAutoJoin.current ||
      !userId ||
      !userName
    )
      return

    const action = router.query.action
    const gameType = router.query.gameType as string

    if (action === "join" && gameType) {
      hasHandledAutoJoin.current = true
      handleAutoJoin(gameType)
    }
  }, [
    isLoading,
    router.isReady,
    router.query,
    userId,
    userName,
    handleAutoJoin,
  ])
}
