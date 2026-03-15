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

type RouterQueryValue = string | string[] | undefined

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
    const storedSessionId = globalThis.sessionStorage.getItem("userId")
    const storedSessionUserName = globalThis.sessionStorage.getItem("userName")
    const storedId =
      storedSessionId || globalThis.localStorage.getItem("userId")
    const useSessionStorage = Boolean(storedSessionId || storedSessionUserName)
    if (storedId) {
      setUserId(storedId)
    } else {
      const newId = getUID()
      setUserId(newId)
      if (useSessionStorage) {
        globalThis.sessionStorage.setItem("userId", newId)
      } else {
        globalThis.localStorage.setItem("userId", newId)
      }
    }

    const storedUserName =
      storedSessionUserName || globalThis.localStorage.getItem("userName")
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

    const getQueryValue = (value: RouterQueryValue) =>
      Array.isArray(value) ? value[0] : value

    const urlUserId = getQueryValue(
      router.query.playerId ?? router.query.userId
    )
    const urlUserName = getQueryValue(router.query.userName)
    if (urlUserId || urlUserName) {
      if (urlUserId) {
        setUserId(urlUserId)
        globalThis.sessionStorage.setItem("userId", urlUserId)
      }
      if (urlUserName) {
        setUserName(urlUserName)
        globalThis.sessionStorage.setItem("userName", urlUserName)
        if (!urlUserId) {
          const newId = getUID()
          setUserId(newId)
          globalThis.sessionStorage.setItem("userId", newId)
        }
      }
    }
  }, [
    router.isReady,
    router.query.playerId,
    router.query.userId,
    router.query.userName,
  ])

  const handleSetUserName = useCallback((name: string) => {
    setUserName(name)
    globalThis.localStorage.setItem("userName", name)
    // Generate a new user ID when username changes
    const newId = getUID()
    setUserId(newId)
    globalThis.localStorage.setItem("userId", newId)
    console.log("Generated new player ID due to username change: " + newId)
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
