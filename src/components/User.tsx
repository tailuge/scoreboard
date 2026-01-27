import React, { useState, useRef, useEffect } from "react"
import { UserIcon } from "@heroicons/react/24/solid"
import { useUser } from "@/contexts/UserContext"

export function User() {
  const { userName, userId, setUserName } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [newUserName, setNewUserName] = useState(userName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNewUserName(userName)
  }, [userName])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    setUserName(newUserName)
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
