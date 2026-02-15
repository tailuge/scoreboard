import { render, screen } from "@testing-library/react"
import ApiDoc from "@/pages/api-doc"

// Mock next/dynamic to avoid loading the actual swagger-ui-react
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    return function MockSwaggerUI({ spec }: { spec: any }) {
      return (
        <div data-testid="swagger-ui">
          Mock Swagger UI for {spec?.info?.title}
        </div>
      )
    }
  },
}))

describe("ApiDoc page", () => {
  it("renders correctly with spec", () => {
    const mockSpec = {
      info: {
        title: "Test API",
      },
    }
    render(<ApiDoc spec={mockSpec} />)
    expect(screen.getByTestId("swagger-ui")).toBeInTheDocument()
    expect(screen.getByText(/Mock Swagger UI for Test API/)).toBeInTheDocument()
  })
})
