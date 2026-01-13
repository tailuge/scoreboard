import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { NchanSub } from "@/nchan/nchansub"
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid"

interface LogMessage {
  clientId: string
  type: string
  [key: string]: any
}

export default function TableLogs() {
  const router = useRouter()
  const { tableId } = router.query
  const [messages, setMessages] = useState<string[]>([])
  const [subscription, setSubscription] = useState<NchanSub | null>(null)
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(
    new Set()
  )

  const filterConsecutiveAimMessages = (messages: string[]): string[] => {
    return messages.filter((message, index) => {
      const currentMsg = JSON.parse(message)
      const nextMsg =
        index + 1 < messages.length ? JSON.parse(messages[index + 1]) : null
      return currentMsg.type !== "AIM" || !nextMsg || nextMsg.type !== "AIM"
    })
  }

  useEffect(() => {
    if (!tableId) return

    const sub = new NchanSub(
      tableId as string,
      (message) => {
        const messageString = message.toString()
        setMessages((prev) => [...prev, messageString])
      },
      "table"
    )

    sub.start()
    setSubscription(sub)

    return () => {
      if (sub) {
        sub.stop()
      }
    }
  }, [tableId])

  const toggleMessage = (index: number) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const renderMessages = (messages: string[]) => {
    const filteredMessages = filterConsecutiveAimMessages(messages)
    return filteredMessages.map((message, index) => {
      try {
        const parsedMessage: LogMessage = JSON.parse(message)
        const isExpanded = expandedMessages.has(index)
        return (
          <div
            key={index}
            className="py-0 min-h-[1rem] border-b border-gray-100 last:border-b-0"
          >
            <div
              className="text-xs p-px cursor-pointer hover:bg-gray-100 flex items-center"
              onClick={() => toggleMessage(index)}
              onKeyDown={(e) => {
                // Trigger the same action for "Enter" or "Space" key
                if (e.key === "Enter" || e.key === " ") {
                  toggleMessage(index)
                }
              }}
              role="button" // Indicates that the div acts like a button
              tabIndex={0} // Makes the div focusable
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500 mr-1" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500 mr-1" />
              )}
              {parsedMessage.clientId} {parsedMessage.type}
            </div>
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
            key={index}
            className="py-1 min-h-[2rem] border-b border-gray-100 last:border-b-0 text-red-500"
          >
            Invalid JSON: {message}
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
