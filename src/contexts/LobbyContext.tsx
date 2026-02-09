import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { NchanSub } from "@/nchan/nchansub"

interface LobbyContextType {
  lastMessage: any
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined)

export function LobbyProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    const sub = new NchanSub("lobby", (msg) => {
      try {
        setLastMessage(JSON.parse(msg))
      } catch {
        // Ignore non-JSON messages or handle them if necessary
      }
    })
    sub.start()
    return () => sub.stop()
  }, [])

  const value = useMemo(() => ({ lastMessage }), [lastMessage])

  return <LobbyContext.Provider value={value}>{children}</LobbyContext.Provider>
}

export function useLobbyContext() {
  const context = useContext(LobbyContext)
  if (context === undefined) {
    throw new Error("useLobbyContext must be used within a LobbyProvider")
  }
  return context
}
