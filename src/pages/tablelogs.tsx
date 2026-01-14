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

  const filterConsecutiveAimMessages = (
    messages: MessageItem[]
  ): MessageItem[] => {
    return messages.filter((message, index) => {
      const currentMsg = JSON.parse(message.content)
      const nextMsg =
        index + 1 < messages.length
          ? JSON.parse(messages[index + 1].content)
          : null
      return currentMsg.type !== "AIM" || nextMsg?.type !== "AIM"
    })
  }

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
    const filteredMessages = filterConsecutiveAimMessages(messages)
    return filteredMessages.map((message) => {
      try {
        const parsedMessage: LogMessage = JSON.parse(message.content)
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
              {parsedMessage.clientId} {parsedMessage.type}
            </button>
            {isExpanded && (
              <div className="text-black pl-4">
                {JSON.stringify(parsedMessage, null, 2)}
              </div>
            )}
          </div>
        )
      } catch {
        return (
          <div
            key={message.id}
            className="py-1 min-h-[2rem] border-b border-gray-100 last:border-b-0 text-red-500"
          >
            Invalid JSON: {message.content}
          </div>
        )
      }
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
