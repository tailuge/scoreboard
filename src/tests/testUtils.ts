import { useRouter } from "next/router"
import { useUser } from "@/contexts/UserContext"

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

export const mockFetchResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  })
}

export const lobbyContextMock = {
  LobbyProvider: ({ children }: { children: React.ReactNode }) => children,
  useLobbyContext: jest.fn(),
  useLobbyMessages: jest.fn(() => ({ lastMessage: null })),
  usePresenceMessages: jest.fn(() => ({ lastMessage: null })),
}

export const createFetchMock = (handlers: {
  [urlPattern: string]: (url: string, options?: any) => Promise<any>
}) => {
  const patterns = Object.keys(handlers).sort((a, b) => b.length - a.length)
  return jest.fn().mockImplementation((url, options) => {
    const urlString = url.toString()
    for (const pattern of patterns) {
      if (urlString.includes(pattern)) {
        return handlers[pattern](urlString, options)
      }
    }
    return mockFetchResponse([])
  })
}
