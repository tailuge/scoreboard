import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { GameUrl } from "@/utils/GameUrl"
import { Table } from "@/services/table"
import { IFrameOverlay } from "./IFrameOverlay"

const isInsideIframe = () => {
  try {
    return globalThis.self !== globalThis.top
  } catch (e) {
    return true
  }
}

async function markComplete(tableId: string): Promise<string> {
  const response = await fetch(`/api/tables/${tableId}/complete`, {
    method: "PUT",
  })
  if (!response.ok) {
    throw new Error("Failed to mark table as complete")
  }
  const table: Table = await response.json()
  return table.creator.id
}

interface PlayModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly tableId: string
  readonly userName: string
  readonly userId: string
  readonly ruleType: string
}

export function PlayModal({
  isOpen,
  onClose,
  tableId,
  userName,
  userId,
  ruleType,
}: PlayModalProps) {
  const [showIframe, setShowIframe] = useState(false)
  const [gameUrl, setGameUrl] = useState<URL | null>(null)

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleStartGame = async () => {
    try {
      const creatorId = await markComplete(tableId)
      const target = GameUrl.create({
        tableId,
        userName,
        userId,
        ruleType,
        isCreator: userId === creatorId,
      })

      if (isInsideIframe()) {
        setGameUrl(target)
        setShowIframe(true)
      } else {
        globalThis.open(target.toString(), "_blank")
        onClose()
      }
    } catch (error) {
      console.error("Error starting game:", error)
      // Optionally, show an error message to the user
    }
  }

  const handleIframeClose = () => {
    setShowIframe(false)
    setGameUrl(null)
    onClose()
  }

  if (showIframe && gameUrl) {
    return <IFrameOverlay target={gameUrl} onClose={handleIframeClose} />
  }

  return createPortal(
    <div className="play-modal-overlay">
      <div className="play-modal-container">
        <h2 className="play-modal-title">Opponent Ready</h2>
        <p className="play-modal-text">Your table is ready to play</p>
        <div className="play-modal-buttons">
          <button onClick={handleStartGame} className="play-modal-start-button">
            Start Game
          </button>
          <button onClick={onClose} className="play-modal-cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
