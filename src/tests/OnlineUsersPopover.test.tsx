import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { OnlineUsersPopover } from "../components/OnlineUsersPopover"

describe("OnlineUsersPopover", () => {
  const mockUsers = [
    {
      messageType: "presence",
      type: "join",
      userId: "user-1",
      userName: "User 1",
      meta: { country: "US", ua: "ua-1", host: "localhost" },
    },
    {
      messageType: "presence",
      type: "join",
      userId: "user-2",
      userName: "User 2",
      meta: { country: "GB", ua: "ua-2", host: "localhost" },
    },
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
    expect(screen.queryByLabelText("Online users")).not.toBeInTheDocument()

    // Open
    fireEvent.click(button)
    expect(screen.getByLabelText("Online users")).toBeInTheDocument()
    expect(screen.getByText(/🇬🇧 User 2/)).toBeInTheDocument()

    // Close
    fireEvent.click(button)
    expect(screen.queryByLabelText("Online users")).not.toBeInTheDocument()
  })

  it("closes when clicking outside", () => {
    render(
      <div data-testid="outside">
        <OnlineUsersPopover count={2} users={mockUsers} totalCount={2} />
      </div>
    )

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.getByLabelText("Online users")).toBeInTheDocument()

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"))
    expect(screen.queryByLabelText("Online users")).not.toBeInTheDocument()
  })

  it("does not close when clicking inside the popover", () => {
    render(<OnlineUsersPopover count={2} users={mockUsers} totalCount={2} />)

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.getByLabelText("Online users")).toBeInTheDocument()

    // Click inside
    fireEvent.mouseDown(screen.getByLabelText("Online users"))
    expect(screen.getByLabelText("Online users")).toBeInTheDocument()
  })

  it("shows overflow count correctly", () => {
    render(<OnlineUsersPopover count={10} users={mockUsers} totalCount={10} />)

    fireEvent.click(screen.getByLabelText("10 users online"))
    expect(screen.getByText("+8 more active")).toBeInTheDocument()
  })

  it("handles missing totalCount", () => {
    render(<OnlineUsersPopover count={2} users={mockUsers} />)

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.queryByText(/more active/)).not.toBeInTheDocument()
  })

  it("shows game icon for external sites (non-github.io)", () => {
    const externalUsers = [
      {
        messageType: "presence",
        type: "join",
        userId: "user-1",
        userName: "User 1",
        meta: { country: "US", ua: "ua-1", host: "localhost" },
      },
      {
        messageType: "presence",
        type: "join",
        userId: "user-2",
        userName: "User 2",
        meta: { country: "GB", ua: "ua-2", host: "example.com" },
      },
    ]

    render(
      <OnlineUsersPopover
        count={2}
        users={externalUsers}
        currentUserId="user-1"
      />
    )

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.getByText("🎮")).toBeInTheDocument()
  })

  it("does not show game icon for same-origin users", () => {
    const sameOriginUsers = [
      {
        messageType: "presence",
        type: "join",
        userId: "user-1",
        userName: "User 1",
        meta: { country: "US", ua: "ua-1", host: "localhost" },
      },
      {
        messageType: "presence",
        type: "join",
        userId: "user-2",
        userName: "User 2",
        meta: { country: "GB", ua: "ua-2", host: "localhost" },
      },
    ]

    render(
      <OnlineUsersPopover
        count={2}
        users={sameOriginUsers}
        currentUserId="user-1"
      />
    )

    fireEvent.click(screen.getByLabelText("2 users online"))
    expect(screen.queryByText("🎮")).not.toBeInTheDocument()
  })
})
