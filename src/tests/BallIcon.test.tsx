import { render } from "@testing-library/react"
import { BallIcon } from "@/components/BallIcon"
import "@testing-library/jest-dom"

describe("BallIcon component", () => {
  it("renders an SVG element for valid ball numbers", () => {
    const { container } = render(<BallIcon number={1} />)

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("viewBox", "0 0 100 100")
  })

  it("renders with custom size", () => {
    const { container } = render(<BallIcon number={8} size={64} />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveAttribute("width", "64")
    expect(svg).toHaveAttribute("height", "64")
  })

  it("renders all ball numbers 1-15 without crashing", () => {
    for (let i = 1; i <= 15; i++) {
      const { container } = render(<BallIcon number={i} />)
      expect(container.querySelector("svg")).toBeInTheDocument()
    }
  })
})
