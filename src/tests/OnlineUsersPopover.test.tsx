import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { OnlineUsersPopover } from "../components/OnlineUsersPopover"
import "@testing-library/jest-dom"

describe("OnlineUsersPopover Accessibility", () => {
  const mockUsers = [
    { userId: "user-1", userName: "Alice" },
    { userId: "user-2", userName: "Bob" },
  ]

  it("should have correct ARIA attributes on the trigger button", () => {
    render(<OnlineUsersPopover count={2} users={mockUsers} />)
    const button = screen.getByRole("button", { name: /2 users online/i })
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(button).not.toHaveAttribute("aria-haspopup")
  })

  it("should open the popover and display users", () => {
    render(<OnlineUsersPopover count={2} users={mockUsers} />)
    const button = screen.getByRole("button", { name: /2 users online/i })
    fireEvent.click(button)

    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("should not have interactive ARIA roles for the read-only list", () => {
    render(<OnlineUsersPopover count={2} users={mockUsers} />)
    const button = screen.getByRole("button", { name: /2 users online/i })
    fireEvent.click(button)

    const listbox = screen.queryByRole("listbox")
    expect(listbox).not.toBeInTheDocument()
    const options = screen.queryAllByRole("option")
    expect(options).toHaveLength(0)

    // Should have an aria-label on the list
    expect(screen.getByLabelText("Online users list")).toBeInTheDocument()
  })
})
