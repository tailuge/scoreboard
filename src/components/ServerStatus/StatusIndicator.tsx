import { FC } from "react"
import {
  ArrowPathIcon,
  ComputerDesktopIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"
import type { ServerStatusState } from "../hooks/useServerStatus"

let textConnect = "Connecting..."

const ConnectingStatus: FC = () => (
  <span className="flex items-center">
    <ArrowPathIcon className="status-icon status-icon-connecting" />
    <span className="status-text">{textConnect}</span>
  </span>
)

const OnlineStatus: FC<{ isOnline: boolean }> = ({ isOnline }) => (
  <ComputerDesktopIcon
    className={`status-icon ${isOnline ? "status-icon-online" : "status-icon-offline"}`}
  />
)

const UserCount: FC<{ activeUsers: number | null }> = ({ activeUsers }) => {
  if (activeUsers === null) return null
  textConnect = ""
  return (
    <>
      <span className="status-text">{activeUsers}</span>
      <UsersIcon className="status-icon status-text" />
    </>
  )
}

const ServerStatusText: FC<
  Pick<ServerStatusState, "serverStatus" | "isOnline" | "isConnecting">
> = ({ serverStatus, isOnline, isConnecting }) => {
  if (isOnline || isConnecting) return null
  return <span className="status-text">{serverStatus}</span>
}

interface StatusIndicatorProps extends ServerStatusState {
  onClick: () => void
}

export const StatusIndicator: FC<StatusIndicatorProps> = ({
  isConnecting,
  isOnline,
  activeUsers,
  serverStatus,
  onClick,
}) => {
  let statusClass = "status-offline"
  if (isConnecting) {
    statusClass = "status-connecting"
  } else if (isOnline) {
    statusClass = "status-online"
  }

  return (
    <button className={`status-indicator ${statusClass}`} onClick={onClick}>
      {isConnecting ? (
        <ConnectingStatus />
      ) : (
        <OnlineStatus isOnline={isOnline} />
      )}
      <UserCount activeUsers={activeUsers} />
      <ServerStatusText
        serverStatus={serverStatus}
        isOnline={isOnline}
        isConnecting={isConnecting}
      />
    </button>
  )
}
