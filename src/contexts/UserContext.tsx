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
import { getAnonymousName } from "@/utils/locale"

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
  const [userName, setUserName] = useState("Anonymous")
  const router = useRouter()

  useEffect(() => {
    const storedUserName = localStorage.getItem("userName")
    if (storedUserName) {
      setUserName(storedUserName)
    } else {
      // For new users, use localized "Anonymous"
      setUserName(getAnonymousName(navigator.language))
    }
    localStorage.setItem("userId", userId)
  }, [userId])

  useEffect(() => {
    // Only persist if it's not the generic English "Anonymous" or if it was explicitly set
    // But to keep it simple and match existing behavior, we'll just persist it.
    // However, the user might want it to stay dynamic if they haven't set it.
    // For now, let's just update the initial choice.
    localStorage.setItem("userName", userName)
  }, [userName])

  useEffect(() => {
    if (!router.isReady) return

    const urlUserName = router.query.username as string
    if (urlUserName) {
      setUserName(urlUserName)
    }
  }, [router.isReady, router.query.username])

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
