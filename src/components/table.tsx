import { Table } from "@/types/table"
import { UserPlusIcon, EyeIcon } from "@heroicons/react/24/solid"
import { GameUrl } from "@/utils/GameUrl"
import { IFrameOverlay } from "./IFrameOverlay"
import { useState, memo, useMemo } from "react"
import { useUser } from "@/contexts/UserContext"

const TablePockets = () => (
  <>
    <div className="table-pocket table-pocket-top-left"></div>
    <div className="table-pocket table-pocket-top-right"></div>
    <div className="table-pocket table-pocket-bottom-left"></div>
    <div className="table-pocket table-pocket-bottom-right"></div>
    <div className="table-pocket-middle table-pocket-top"></div>
    <div className="table-pocket-middle table-pocket-bottom"></div>
  </>
)

interface TableContentProps {
  readonly table: Table
  readonly isCreator: boolean
  readonly onJoin: (tableId: string) => void
  readonly onSpectate: () => void
  readonly disableActions: boolean
}

function TableContent({
  table,
  isCreator,
  onJoin,
  onSpectate,
  disableActions,
}: TableContentProps) {
  const opponentName =
    table.players.length > 1
      ? `vs ${table.players[1].name}`
      : "- waiting for opponent"
  const canJoin = !disableActions && !isCreator && table.players.length < 2
  const canSpectate = !disableActions && !isCreator && table.players.length >= 2

  return (
    <div className="table-content">
      <div className="text-center">
        <p className="table-title">{table.ruleType}</p>
        <p className="table-players">
          {table.creator.name} {opponentName}
        </p>
      </div>
      <div className="table-actions">
        {canJoin && (
          <button
            onClick={() => onJoin(table.id)}
            className="table-button"
            aria-label="Join Table"
          >
            <UserPlusIcon className="h-5 w-5 text-white" />
          </button>
        )}
        {canSpectate && (
          <button
            onClick={onSpectate}
            className="table-button"
            aria-label="Spectate Table"
          >
            <EyeIcon className="h-5 w-5 text-white" />
            <span className="table-spectator-count">
              {table.spectators.length}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

function getStatusClass(
  base: "table" | "felt",
  ruleType: string,
  playerCount: number,
  completed: boolean
): string {
  if (playerCount < 2) {
    return `${base}-${ruleType}`
  }
  if (completed) {
    return `${base}-completed`
  }
  return base === "table" ? "table-occupied" : "felt-default"
}

function TableItemComponent({
  table,
  onJoin,
  onSpectate,
  disableActions = false,
}: {
  readonly table: Table
  readonly onJoin: (tableId: string) => void
  readonly onSpectate: (tableId: string) => void
  readonly disableActions?: boolean
}) {
  const { userId, userName } = useUser()
  const [isSpectating, setIsSpectating] = useState(false)
  const isCreator = table.creator.id === userId

  const tableClass = getStatusClass(
    "table",
    table.ruleType,
    table.players.length,
    table.completed
  )
  const feltClass = getStatusClass(
    "felt",
    table.ruleType,
    table.players.length,
    table.completed
  )

  const handleSpectate = () => {
    setIsSpectating(true)
    onSpectate(table.id)
  }

  const handleCloseSpectate = () => {
    setIsSpectating(false)
  }

  // Memoize the spectator URL as it involves multiple URLSearchParams appends
  const spectatorUrl = useMemo(
    () =>
      GameUrl.create({
        tableId: table.id,
        userName,
        userId,
        ruleType: table.ruleType,
        isSpectator: true,
        isCreator: false,
      }),
    [table.id, userName, userId, table.ruleType]
  )

  return (
    <>
      {isSpectating && (
        <IFrameOverlay
          target={spectatorUrl}
          onClose={handleCloseSpectate}
          title="Spectator Window"
        />
      )}
      <div
        className={`table-card ${tableClass} ${isCreator ? "table-card-creator" : ""}`}
      >
        <div className="table-container">
          <div className="table-inner">
            <div className={`table-felt ${feltClass}`}></div>
            <TableContent
              table={table}
              isCreator={isCreator}
              onJoin={onJoin}
              onSpectate={handleSpectate}
              disableActions={disableActions}
            />
            {table.ruleType !== "threecushion" && <TablePockets />}
          </div>
        </div>
      </div>
    </>
  )
}

// Optimization: Prevent re-renders of table items if the table data hasn't changed.
// We use lastUsedAt as a version marker for the table state.
export const TableItem = memo(TableItemComponent, (prev, next) => {
  return (
    prev.table.id === next.table.id &&
    prev.table.lastUsedAt === next.table.lastUsedAt &&
    prev.onJoin === next.onJoin &&
    prev.onSpectate === next.onSpectate
  )
})
