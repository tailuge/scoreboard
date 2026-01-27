import { render, screen, fireEvent } from "@testing-library/react"
import { User } from "@/components/User"
import "@testing-library/jest-dom"
import { useUser } from "@/contexts/UserContext"

jest.mock("@/contexts/UserContext", () => ({
  useUser: jest.fn(),
}))
const mockedUseUser = useUser as jest.Mock

describe("User component", () => {
  const mockSetUserName = jest.fn()

  beforeEach(() => {
    mockSetUserName.mockClear()
    mockedUseUser.mockReturnValue({
      userName: "TestUser",
      userId: "user-123",
      setUserName: mockSetUserName,
    })
  })

  it("renders with user name and enters edit mode on click", () => {
    render(<User />)

    // Initial render check
    expect(screen.getByText("TestUser")).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveAttribute(
      "title",
      "TestUser\nuser-123"
    )

    // Enter edit mode
    fireEvent.click(screen.getByText("TestUser"))
    const input = screen.getByRole("textbox")
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue("TestUser")

    // Change name and save
    fireEvent.change(input, { target: { value: "NewName" } })
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })

    // Verify callback
    expect(mockSetUserName).toHaveBeenCalledWith("NewName")
  })
})
