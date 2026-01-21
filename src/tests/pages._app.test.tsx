import { render } from "@testing-library/react"
import App from "@/pages/_app"

// Mock the Vercel analytics components
jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div>SpeedInsights</div>,
}))

jest.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div>Analytics</div>,
}))

describe("App", () => {
  it("renders the component and analytics scripts", () => {
    const mockPageProps = {}
    const MockComponent = () => <div>Mock Component</div>
    const { getByText } = render(
      <App Component={MockComponent} pageProps={mockPageProps} />
    )

    expect(getByText("Mock Component")).toBeInTheDocument()
    expect(getByText("SpeedInsights")).toBeInTheDocument()
    expect(getByText("Analytics")).toBeInTheDocument()
  })
})
