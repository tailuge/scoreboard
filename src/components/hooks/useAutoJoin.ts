import { useEffect, useRef } from "react"
import { NextRouter } from "next/router"
import { Table } from "@/types/table"

export function useAutoJoin(
  router: NextRouter,
  isLoading: boolean,
  userId: string | null,
  userName: string | null,
  tables: Table[],
  handleJoin: (tableId: string) => Promise<boolean>,
  createTable: (ruleType: string) => Promise<boolean>
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
      const existingTable = tables.find(
        (t) => t.ruleType === gameType && !t.completed
      )

      if (existingTable) {
        handleJoin(existingTable.id)
      } else {
        createTable(gameType)
      }
    }
  }, [
    isLoading,
    router.isReady,
    router.query,
    tables,
    userId,
    userName,
    createTable,
    handleJoin,
  ])
}
