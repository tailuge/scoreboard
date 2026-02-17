import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { OnlineUsersPopover } from "../components/OnlineUsersPopover"

describe("OnlineUsersPopover", () => {
  const mockUsers = [
    { userId: "user-1", userName: "User 1" },
    { userId: "user-2", userName: "User 2" },
  ]

  it("renders correctly and toggles visibility", () => {
    render(
      <OnlineUsersPopover
        count={2}
        users={mockUsers}
        totalCount={2}
        currentUserId="user-1"
      />
    )

    const button = screen.getByLabelText("2 users online")
    // Initially closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    // Open
    fireEvent.click(button)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("User 1")).toBeInTheDocument()
    expect(screen.getByText("User 2")).toBeInTheDocument()
    expect(screen.getByText("Identified")).toBeInTheDocument()
    expect(screen.getByText("Online")).toBeInTheDocument()

    // Close
    fireEvent.click(button)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("closes when clicking outside", () => {
    render(
      <div data-testid="outside">
        <OnlineUsersPopover count={2} users={mockUsers} totalCount={2} />
      </div>
    )

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("does not close when clicking inside the popover", () => {
    render(<OnlineUsersPopover count={2} users={mockUsers} totalCount={2} />)

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    // Click inside
    fireEvent.mouseDown(screen.getByRole("dialog"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("shows overflow count correctly", () => {
    render(<OnlineUsersPopover count={10} users={mockUsers} totalCount={10} />)

    fireEvent.click(screen.getByLabelText("10 users online"))
    expect(screen.getByText("+8 more active")).toBeInTheDocument()

    // Check total active count in footer
    const totalActiveLabel = screen.getByText("Total Active:")
    const footerCount = totalActiveLabel.nextElementSibling
    expect(footerCount?.textContent).toBe("10")
  })

  it("handles missing totalCount", () => {
    render(<OnlineUsersPopover count={2} users={mockUsers} />)

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.queryByText(/more active/)).not.toBeInTheDocument()

    const totalActiveLabel = screen.getByText("Total Active:")
    const footerCount = totalActiveLabel.nextElementSibling
    expect(footerCount?.textContent).toBe("2")
  })
})
