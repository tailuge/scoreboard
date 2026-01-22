import { createPortal } from "react-dom"

interface IFrameOverlayProps {
  readonly target: URL
  readonly onClose: () => void
  readonly title: string
}

export function IFrameOverlay({ target, onClose, title }: IFrameOverlayProps) {
  return createPortal(
    <div className="iframe-overlay">
      <div className="iframe-container">
        <iframe
          src={target.toString()}
          className="iframe-element"
          title={title}
        />
        <button onClick={onClose} className="iframe-close-button">
          Close
        </button>
      </div>
    </div>,
    document.body
  )
}
