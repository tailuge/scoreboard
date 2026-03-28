import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { ChatCard } from "../components/ChatCard"
import type { ChatMessage } from "@tailuge/messaging"

describe("ChatCard", () => {
  const mockOnSend = jest.fn()
  const mockOnClose = jest.fn()
  const currentUserId = "me-id"
  const opponentName = "Alice"

  const mockMessages: ChatMessage[] = [
    {
      senderId: "alice-id",
      text: "Hello!",
      meta: { ts: 1000 },
    },
    {
      senderId: "me-id",
      text: "Hi Alice!",
      meta: { ts: 2000 },
    },
    {
      senderId: "alice-id",
      text: "No meta here",
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders the opponent name in the header", () => {
    render(
      <ChatCard
        opponentName={opponentName}
        messages={[]}
        onSend={mockOnSend}
        onClose={mockOnClose}
        currentUserId={currentUserId}
      />
    )
    expect(screen.getByText(`Chat with ${opponentName}`)).toBeInTheDocument()
  })

  it("renders 'No messages yet' when message list is empty", () => {
    render(
      <ChatCard
        opponentName={opponentName}
        messages={[]}
        onSend={mockOnSend}
        onClose={mockOnClose}
        currentUserId={currentUserId}
      />
    )
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument()
  })

  it("renders messages and distinguishes between me and opponent", () => {
    render(
      <ChatCard
        opponentName={opponentName}
        messages={mockMessages}
        onSend={mockOnSend}
        onClose={mockOnClose}
        currentUserId={currentUserId}
      />
    )

    expect(screen.getByText("Hello!")).toBeInTheDocument()
    expect(screen.getByText("Hi Alice!")).toBeInTheDocument()
    expect(screen.getByText("No meta here")).toBeInTheDocument()

    // Check for CSS classes that distinguish me vs opponent
    const opponentBubble = screen.getByText("Hello!").parentElement
    const myBubble = screen.getByText("Hi Alice!").parentElement

    expect(opponentBubble).toHaveClass("justify-start")
    expect(myBubble).toHaveClass("justify-end")
  })

  it("calls onSend when a message is submitted", () => {
    render(
      <ChatCard
        opponentName={opponentName}
        messages={[]}
        onSend={mockOnSend}
        onClose={mockOnClose}
        currentUserId={currentUserId}
      />
    )

    const input = screen.getByPlaceholderText(/Type a message.../i)
    const sendButton = screen.getByRole("button", { name: /send message/i })

    fireEvent.change(input, { target: { value: "Testing" } })
    fireEvent.click(sendButton)

    expect(mockOnSend).toHaveBeenCalledWith("Testing")
    expect(input).toHaveValue("")
  })

  it("does not call onSend if input is only whitespace", () => {
    render(
      <ChatCard
        opponentName={opponentName}
        messages={[]}
        onSend={mockOnSend}
        onClose={mockOnClose}
        currentUserId={currentUserId}
      />
    )

    const input = screen.getByPlaceholderText(/Type a message.../i)
    const form = screen.getByRole("textbox").closest("form")!

    fireEvent.change(input, { target: { value: "   " } })
    fireEvent.submit(form)

    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it("calls onClose when the close button is clicked", () => {
    render(
      <ChatCard
        opponentName={opponentName}
        messages={[]}
        onSend={mockOnSend}
        onClose={mockOnClose}
        currentUserId={currentUserId}
      />
    )

    const closeButton = screen.getByRole("button", { name: /close chat/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
