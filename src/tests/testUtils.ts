import { useRouter } from "next/router"
import { useUser } from "@/contexts/UserContext"
import { useLobbyMessages, usePresenceMessages } from "@/contexts/LobbyContext"

export const setupRouterMock = (query = {}, isReady = true, push = jest.fn()) => {
  ;(useRouter as jest.Mock).mockReturnValue({
    query,
    isReady,
    push,
  })
}

export const setupUserMock = (userId = "test-user-id", userName = "TestUser", setUserName = jest.fn()) => {
  ;(useUser as jest.Mock).mockReturnValue({
    userId,
    userName,
    setUserName,
  })
}

export const setupLobbyMocks = () => {
  ;(useLobbyMessages as jest.Mock).mockReturnValue({ lastMessage: null })
  ;(usePresenceMessages as jest.Mock).mockReturnValue({ lastMessage: null })
}

export const mockFetchResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  })
}

export const createFetchMock = (handlers: {
  [urlPattern: string]: (url: string, options?: any) => Promise<any>
}) => {
  const patterns = Object.keys(handlers).sort((a, b) => b.length - a.length)
  return jest.fn().mockImplementation((url, options) => {
    let urlString = ""
    if (typeof url === "string") {
      urlString = url
    } else if (url instanceof URL) {
      urlString = url.href
    } else if (url && typeof url === "object" && "url" in url) {
      urlString = (url as any).url
    }

    for (const pattern of patterns) {
      if (urlString.includes(pattern)) {
        return handlers[pattern](urlString, options)
      }
    }
    return mockFetchResponse([])
  })
}
