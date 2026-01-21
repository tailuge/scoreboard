import { render } from "@testing-library/react"
import Home from "@/pages/index"
import { useRouter } from "next/router"

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}))

describe("Home page", () => {
  it("should redirect to /game", () => {
    const push = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue({ push })

    render(<Home />)

    expect(push).toHaveBeenCalledWith("/game")
  })
})
