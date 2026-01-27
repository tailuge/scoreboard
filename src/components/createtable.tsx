import { useState, useEffect, useRef } from "react"
import { useServerStatus } from "./hooks/useServerStatus"
import { STATUS_PAGE_URL } from "@/utils/constants"

export function CreateTable({
  userId,
  userName,
  onCreate,
}: {
  readonly userId: string
  readonly userName: string
  readonly onCreate: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [ruleType, setRuleType] = useState("nineball")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isOnline } = useServerStatus(STATUS_PAGE_URL)

  const handleCreate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, ruleType }),
      })
      if (!response.ok) throw new Error("Failed to create table")
      onCreate()
    } finally {
      setIsLoading(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside: EventListenerOrEventListenerObject = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    const options: AddEventListenerOptions = { passive: true }
    document.addEventListener("mousedown", handleClickOutside, options)

    return () => {
      // To correctly remove the listener, the same options object must be passed.
      document.removeEventListener("mousedown", handleClickOutside, options)
    }
  }, [])

  return (
    <div className="game-button-group">
      <div className="flex items-stretch">
        <button
          key={isOnline ? "online" : "offline"} // Add key to force re-render
          onClick={handleCreate}
          disabled={isLoading || !isOnline}
          className={`game-button-main ${
            isOnline && !isLoading
              ? "game-button-enabled"
              : "game-button-disabled"
          }`}
          title={isOnline ? "" : "Server offline"}
        >
          Play {ruleType.charAt(0).toUpperCase() + ruleType.slice(1)}
        </button>
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          disabled={!isOnline}
          className={`game-button-dropdown ${
            isOnline ? "game-button-enabled" : "game-button-disabled"
          }`}
        >
          ▼
        </button>
      </div>
      {dropdownOpen && (
        <div ref={dropdownRef} className="game-dropdown">
          <ul className="game-dropdown-list">
            {["nineball", "snooker", "threecushion"].map((type) => (
              <li
                key={type}
                className={`game-dropdown-item ${
                  ruleType === type ? "game-dropdown-item-selected" : ""
                }`}
              >
                <button
                  className="w-full text-left bg-transparent border-none cursor-pointer"
                  onClick={() => {
                    setRuleType(type)
                    setDropdownOpen(false)
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
