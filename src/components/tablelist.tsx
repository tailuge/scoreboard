import { Table } from "@/types/table"
import { useMemo } from "react"
import { TableItem } from "./table"
import { AnimatePresence, motion } from "framer-motion"

export function TableList({
  userId,
  userName,
  onJoin,
  onSpectate,
  tables,
}: {
  readonly userId: string
  readonly userName: string
  readonly onJoin: (tableId: string) => Promise<boolean>
  readonly onSpectate: (tableId: string) => void
  readonly tables: Table[]
}) {
  const handleJoin = async (tableId: string) => {
    await onJoin(tableId)
  }

  const sortedTables = useMemo(
    () =>
      [...tables].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [tables]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <AnimatePresence>
          {sortedTables.map((table) => (
            <motion.div
              key={table.id}
              className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6 xl:w-1/8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              layout
            >
              <TableItem
                table={table}
                onJoin={handleJoin}
                onSpectate={onSpectate}
                userId={userId}
                userName={userName}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
