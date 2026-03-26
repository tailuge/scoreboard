import React, { useState, useRef, useEffect } from "react"
import type { ChatMessage } from "@tailuge/messaging"
import { PaperAirplaneIcon } from "@heroicons/react/24/solid"

type ChatCardProps = {
  readonly opponentName: string
  readonly opponentId: string
  readonly messages: ChatMessage[]
  readonly onSend: (text: string) => void
  readonly onClose: () => void
  readonly currentUserId: string
}

export function ChatCard({
  opponentName,
  opponentId,
  messages,
  onSend,
  onClose,
  currentUserId,
}: ChatCardProps) {
  const [inputText, setInputText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      onSend(inputText.trim())
      setInputText("")
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-cyan-500/40 bg-gray-800/90 p-4 text-center shadow-xl animate-in fade-in zoom-in duration-300 flex flex-col h-[100px]">
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h3 className="text-lg font-bold text-white truncate pr-4">
          Chat with {opponentName}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2 text-left pr-1 custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm italic text-center mt-4">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId
            return (
              <div
                key={`${msg.senderId}-${msg.meta?.ts || i}`}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${
                    isMe
                      ? "bg-cyan-600 text-white rounded-br-none"
                      : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-900 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}
