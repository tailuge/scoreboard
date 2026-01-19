import { render, screen, fireEvent } from "@testing-library/react"
import { User } from "@/components/User"
import "@testing-library/jest-dom"

describe("User component", () => {
  const mockOnUserNameChange = jest.fn()

  it("renders with user name and enters edit mode on click", () => {
    render(
      <User
        userName="TestUser"
        userId="user-123"
        onUserNameChange={mockOnUserNameChange}
      />
    )

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
    expect(mockOnUserNameChange).toHaveBeenCalledWith("NewName")
  })
})
