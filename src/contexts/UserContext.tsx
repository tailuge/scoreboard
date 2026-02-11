import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import { getUID } from "@/utils/uid"
import { useRouter } from "next/router"

interface UserContextType {
  userId: string
  userName: string
  setUserName: (name: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const [userId] = useState(() => getUID())
  const [userName, setUserName] = useState(() => {
    if (typeof window === "undefined") return "Anonymous"
    return localStorage.getItem("userName") || "Anonymous"
  })
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    const urlUserName = router.query.username as string
    if (urlUserName) {
      setUserName(urlUserName)
    }

    localStorage.setItem("userId", userId)
    localStorage.setItem("userName", userName)
  }, [router.isReady, router.query.username, userId, userName])

  const handleSetUserName = useCallback((name: string) => {
    setUserName(name)
    localStorage.setItem("userName", name)
  }, [])

  const contextValue = useMemo(
    () => ({
      userId,
      userName,
      setUserName: handleSetUserName,
    }),
    [userId, userName, handleSetUserName]
  )

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
