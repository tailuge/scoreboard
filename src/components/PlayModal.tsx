import { useEffect } from "react"
import { GameUrl } from "@/utils/GameUrl"
import { Table } from "@/services/table"

const WEBSOCKET_SERVER = "wss://billiards.onrender.com/ws"

const isInsideIframe = () => {
  return globalThis.self !== globalThis.top
}

function useBodyOverflow(isOpen: boolean) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])
}

async function markComplete(tableId: string) {
  const response = await fetch(`/api/tables/${tableId}/complete`, {
    method: "PUT",
  })
  const table: Table = await response.json()
  return table.creator.id
}

export function createOverlay(target: URL, onClose: () => void) {
  const overlay = document.createElement("div")
  overlay.className = "iframe-overlay"

  const iframeContainer = document.createElement("div")
  iframeContainer.className = "iframe-container"

  const iframe = document.createElement("iframe")
  iframe.src = target.toString()
  iframe.className = "iframe-element"

  iframeContainer.appendChild(iframe)
  overlay.appendChild(iframeContainer)
  document.body.appendChild(overlay)

  const closeButton = document.createElement("button")
  closeButton.textContent = "Close"
  closeButton.className = "iframe-close-button"
  closeButton.onclick = () => {
    document.body.removeChild(overlay)
    onClose()
  }

  iframeContainer.appendChild(closeButton)
}

export function PlayModal({
  isOpen,
  onClose,
  tableId,
  userName,
  userId,
  ruleType,
}: {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly tableId: string
  readonly userName: string
  readonly userId: string
  readonly ruleType: string
}) {
  useBodyOverflow(isOpen)

  if (!isOpen) return null

  const handleStartGame = async () => {
    const creator = await markComplete(tableId)
    const target = GameUrl.create({
      tableId,
      userName,
      userId,
      ruleType,
      isCreator: userId === creator,
    })
    if (isInsideIframe()) {
      createOverlay(target, onClose)
    } else {
      globalThis.open(target.toString(), "_blank")
    }
    if (!isInsideIframe() && onClose) {
      onClose()
    }
  }

  const handleCancel = async () => {
    await markComplete(tableId)
    onClose()
  }

  return (
    <div className="play-modal-overlay">
      <div className="play-modal-container">
        <h2 className="play-modal-title">Opponent Ready</h2>
        <p className="play-modal-text">Your table is ready to play</p>
        <div className="play-modal-buttons">
          <button onClick={handleStartGame} className="play-modal-start-button">
            Start Game
          </button>
          <button onClick={handleCancel} className="play-modal-cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
