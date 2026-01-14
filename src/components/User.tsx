import React, { useState, useRef, useEffect } from "react"
import { UserIcon } from "@heroicons/react/24/solid"

interface UserPillProps {
  readonly userName: string
  readonly userId: string
  readonly onUserNameChange: (newUserName: string) => void
}

export function User({ userName, userId, onUserNameChange }: UserPillProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newUserName, setNewUserName] = useState(userName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onUserNameChange(newUserName)
    setIsEditing(false)
  }

  return (
    <button
      type="button"
      className="user-pill"
      title={`${userName}\n${userId}`}
      onClick={() => setIsEditing(true)}
    >
      <UserIcon className="user-pill-icon" />
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={newUserName}
          maxLength={12}
          onChange={(e) => setNewUserName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="user-pill-input"
        />
      ) : (
        userName
      )}
    </button>
  )
}

export default User
