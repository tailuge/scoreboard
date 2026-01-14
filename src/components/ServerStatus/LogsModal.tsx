import React, { useState, useEffect } from "react"
import { Table } from "@/services/table"
import Link from "next/link"

interface LogsModalProps {
  showLogs: boolean
  onClose: () => void
}

export const LogsModal: React.FC<LogsModalProps> = ({ showLogs, onClose }) => {
  const [tables, setTables] = useState<Table[]>([])

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/tables")
      const data = await res.json()
      setTables(data)
    } catch (error) {
      console.error("Error fetching tables:", error)
    }
  }

  const handleTableClick = (tableId: string) => {
    window.open(`/tablelogs?tableId=${tableId}`, "_blank")
  }

  useEffect(() => {
    if (showLogs) {
      fetchTables()
    }
  }, [showLogs])

  if (!showLogs) return null

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-20 flex items-center justify-center">
      <div className="relative w-3/4 h-3/4 bg-white shadow-lg">
        <button
          className="absolute top-0 right-1 text-black text-l"
          onClick={onClose}
        >
          ✖
        </button>
        <div className="p-4 h-full overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold">Active Tables</h4>
            <Link
              href="./usage.html"
              className="text-blue-600 text-xs hover:text-blue-800 underline"
              target="_blank"
            >
              Usage
            </Link>
          </div>
          {tables.map((table) => (
            <div key={table.id} className="border rounded mb-1">
              <button
                className="p-1 cursor-pointer hover:bg-gray-100 flex items-center w-full text-left"
                onClick={() => handleTableClick(table.id)}
              >
                <div>
                  Table ID: {table.id} Creator: {table.creator.name}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LogsModal
