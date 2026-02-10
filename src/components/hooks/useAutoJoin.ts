import { useEffect, useRef } from "react"
import { NextRouter } from "next/router"

export function useAutoJoin(
  router: NextRouter,
  isLoading: boolean,
  userId: string | null,
  userName: string | null,
  handleAutoJoin: (ruleType: string) => Promise<void>
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
    const ruleType = router.query.ruleType as string

    if (action === "join" && ruleType) {
      hasHandledAutoJoin.current = true
      handleAutoJoin(ruleType)
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
