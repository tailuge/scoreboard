import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { NchanSub } from "@/nchan/nchansub"
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid"

interface LogMessage {
  clientId: string
  type: string
  [key: string]: any
}

interface MessageItem {
  id: number
  content: string
}

export default function TableLogs() {
  const router = useRouter()
  const { tableId } = router.query
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  )

  useEffect(() => {
    if (!tableId) return

    const sub = new NchanSub(
      tableId as string,
      (message) => {
        const messageString = message.toString()
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length > 0 ? prev[prev.length - 1].id + 1 : 0,
            content: messageString,
          },
        ])
      },
      "table"
    )

    sub.start()

    return () => {
      if (sub) {
        sub.stop()
      }
    }
  }, [tableId])

  const toggleMessage = (id: number) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderMessages = (messages: MessageItem[]) => {
    const parsedMessages = messages.map((message) => {
      try {
        return {
          id: message.id,
          parsed: JSON.parse(message.content) as LogMessage,
          originalContent: message.content,
        }
      } catch {
        return {
          id: message.id,
          error: true,
          originalContent: message.content,
        }
      }
    })

    const filteredMessages = parsedMessages.filter((message, index) => {
      if (message.error) return true
      const nextMessage = parsedMessages[index + 1]
      return (
        message.parsed.type !== "AIM" ||
        !nextMessage ||
        nextMessage.error ||
        nextMessage.parsed.type !== "AIM"
      )
    })

    return filteredMessages.map((message) => {
      if (message.error) {
        return (
          <div
            key={message.id}
            className="py-1 min-h-[2rem] border-b border-gray-100 last:border-b-0 text-red-500"
          >
            Invalid JSON: {message.originalContent}
          </div>
        )
      }

      const isExpanded = expandedMessages.has(message.id)
      return (
        <div
          key={message.id}
          className="py-0 min-h-[1rem] border-b border-gray-100 last:border-b-0"
        >
          <button
            type="button"
            className="w-full text-xs p-px cursor-pointer hover:bg-gray-100 flex items-center text-left appearance-none bg-transparent"
            onClick={() => toggleMessage(message.id)}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-1" />
            ) : (
              <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-1" />
            )}
            {message.parsed.clientId} {message.parsed.type}
          </button>
          {isExpanded && (
            <div className="text-black pl-4">
              {JSON.stringify(message.parsed, null, 2)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Logs for Table {tableId}</h1>
      </div>
      <div className="border rounded bg-gray-50 p-4">
        <pre className="font-mono text-[10px] leading-tight whitespace-pre-wrap max-h-[80vh] overflow-auto">
          {renderMessages(messages)}
        </pre>
      </div>
    </div>
  )
}
