import { render } from "@testing-library/react"
import Home from "@/pages/index"
import { useRouter } from "next/router"

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}))

describe("Home page", () => {
  it("should render null", () => {
    const { container } = render(<Home />)
    expect(container.firstChild).toBeNull()
  })
})
