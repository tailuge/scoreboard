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
import { getAnonymousName, anonByLang } from "@/utils/locale"

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
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("Anonymous")
  const router = useRouter()

  useEffect(() => {
    const storedId = globalThis.localStorage.getItem("userId")
    if (storedId) {
      setUserId(storedId)
      console.log("Loaded player ID: " + storedId)
    } else {
      const newId = getUID()
      setUserId(newId)
      globalThis.localStorage.setItem("userId", newId)
      console.log("Generated new player ID: " + newId)
    }

    const storedUserName = globalThis.localStorage.getItem("userName")
    const anonymousNames = Object.values(anonByLang)
    if (storedUserName && !anonymousNames.includes(storedUserName)) {
      setUserName(storedUserName)
    } else {
      // For new users or users with a generic anonymous name, use localized "Anonymous"
      setUserName(getAnonymousName(globalThis.navigator?.language))
    }
  }, [])

  useEffect(() => {
    if (!router.isReady) return

    const urlUserName = router.query.username as string
    if (urlUserName) {
      setUserName(urlUserName)
      globalThis.localStorage.setItem("userName", urlUserName)
    }
  }, [router.isReady, router.query.username])

  const handleSetUserName = useCallback((name: string) => {
    setUserName(name)
    globalThis.localStorage.setItem("userName", name)
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
