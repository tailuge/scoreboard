import { createPortal } from "react-dom"

interface IFrameOverlayProps {
  readonly target: URL
  readonly onClose: () => void
}

export function IFrameOverlay({ target, onClose }: IFrameOverlayProps) {
  return createPortal(
    <div className="iframe-overlay">
      <div className="iframe-container">
        <iframe src={target.toString()} className="iframe-element" />
        <button onClick={onClose} className="iframe-close-button">
          Close
        </button>
      </div>
    </div>,
    document.body
  )
}
