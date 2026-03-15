import { render } from "@testing-library/react"
import App from "@/pages/_app"
import { MessagingProvider } from "@/contexts/MessagingContext"

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Exo: jest.fn(() => ({
    variable: "--font-exo",
    className: "font-exo",
  })),
  Bitcount_Prop_Double: jest.fn(() => ({
    variable: "--font-bitcount",
    className: "font-bitcount",
  })),
}))

jest.mock("@/contexts/MessagingContext", () => ({
  MessagingProvider: jest.fn(({ children }) => <>{children}</>),
}))

// Mock the Vercel analytics components
jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div>SpeedInsights</div>,
}))

jest.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div>Analytics</div>,
}))

// Mock ClientErrorReporter to prevent side effects in tests
jest.mock("@/errors/ClientErrorReporter", () => ({
  ClientErrorReporter: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
  })),
}))

describe("App", () => {
  it("renders the component and analytics scripts", () => {
    const mockPageProps = {}
    const MockComponent = () => <div>Mock Component</div>
    const mockRouter = {
      basePath: "",
      pathname: "/",
      route: "/",
      asPath: "/",
      query: {},
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      isPreview: false,
    }
    const { getByText } = render(
      <App
        Component={MockComponent}
        pageProps={mockPageProps}
        router={mockRouter as any}
      />
    )

    expect(getByText("Mock Component")).toBeInTheDocument()
    expect(getByText("SpeedInsights")).toBeInTheDocument()
    expect(getByText("Analytics")).toBeInTheDocument()
    expect(MessagingProvider).toHaveBeenCalled()
  })
})
