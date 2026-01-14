import { FC } from "react"
import { StatusIndicator } from "./StatusIndicator"
import { useServerStatus } from "../hooks/useServerStatus"

interface ServerStatusProps {
  readonly statusPage: string
}

export const ServerStatus: FC<ServerStatusProps> = ({ statusPage }) => {
  const serverState = useServerStatus(statusPage)

  const handleStatusClick = () => {
    window.open("/server-logs", "_blank")
  }

  return (
    <div className="relative">
      <StatusIndicator {...serverState} onClick={handleStatusClick} />
    </div>
  )
}
