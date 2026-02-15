import { render } from "@testing-library/react"
import New from "@/pages/new"
import { useUser } from "@/contexts/UserContext"
import { useLobbyMessages } from "@/contexts/LobbyContext"

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))

jest.mock("@/contexts/LobbyContext", () => ({
  useLobbyMessages: jest.fn(),
}))

describe("New page", () => {
  beforeEach(() => {
    ;(useUser as jest.Mock).mockReturnValue({
      userId: "test-user",
      userName: "Test User",
    })
    ;(useLobbyMessages as jest.Mock).mockReturnValue({ lastMessage: null })
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
  })

  it("renders without crashing", () => {
    render(<New />)
  })
})
