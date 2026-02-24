import { render } from "@testing-library/react"
import App from "@/pages/_app"
import { useRouter } from "next/router"
import { LobbyProvider } from "@/contexts/LobbyContext"

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Exo: jest.fn(() => ({
    variable: "--font-exo",
    className: "font-exo",
  })),
}))

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}))

jest.mock("@/contexts/LobbyContext", () => ({
  LobbyProvider: jest.fn(({ children }) => <>{children}</>),
}))

// Mock the Vercel analytics components
jest.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => <div>SpeedInsights</div>,
}))

jest.mock("@vercel/analytics/next", () => ({
  Analytics: () => <div>Analytics</div>,
}))

describe("App", () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue({
      pathname: "/",
      query: {},
      isReady: true,
    })
  })

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
  })

  it("uses presence-only subscriptions on /game", () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      pathname: "/game",
      query: {},
      isReady: true,
    })

    const mockPageProps = {}
    const MockComponent = () => <div>Mock Component</div>
    render(
      <App
        Component={MockComponent}
        pageProps={mockPageProps}
        router={{} as any}
      />
    )

    expect(LobbyProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        subscribeLobby: false,
        subscribePresence: true,
      }),
      undefined
    )
  })

  it("keeps both subscriptions on non-game routes", () => {
    ;(useRouter as jest.Mock).mockReturnValue({
      pathname: "/lobby",
      query: {},
      isReady: true,
    })

    const mockPageProps = {}
    const MockComponent = () => <div>Mock Component</div>
    render(
      <App
        Component={MockComponent}
        pageProps={mockPageProps}
        router={{} as any}
      />
    )

    expect(LobbyProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        subscribeLobby: true,
        subscribePresence: true,
      }),
      undefined
    )
  })
})
