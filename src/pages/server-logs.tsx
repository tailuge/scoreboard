import React, { useState, useEffect } from "react"
import { Table } from "@/types/table"
import Link from "next/link"

export default function ServerLogs() {
  const [tables, setTables] = useState<Table[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/tables")
      if (!res.ok) {
        setError(`Error fetching tables: ${res.status} ${res.statusText}`)
        return
      }
      const data = await res.json()
      setTables(data)
    } catch (error) {
      console.error("Error fetching tables:", error)
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      )
    }
  }

  const handleTableClick = (tableId: string) => {
    globalThis.open(`/tablelogs?tableId=${tableId}`, "_blank")
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )
    }

    if (tables.length === 0) {
      return <p className="text-gray-500 italic">No active tables found.</p>
    }

    return tables.map((table) => (
      <div
        key={table.id}
        className="border rounded-lg shadow-sm overflow-hidden"
      >
        <button
          className="p-3 cursor-pointer hover:bg-gray-50 flex items-center w-full text-left transition-colors"
          onClick={() => handleTableClick(table.id)}
        >
          <div className="flex-grow">
            <span className="font-semibold">Table ID:</span> {table.id}
            <span className="ml-4 font-semibold">Creator:</span>{" "}
            {table.creator.name}
          </div>
          <div className="text-blue-500 text-sm">View Logs &rarr;</div>
        </button>
      </div>
    ))
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h1 className="text-xl font-bold">Active Tables</h1>
        <Link
          href="/usage.html"
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
        >
          Usage
        </Link>
      </div>
      <div className="grid gap-2">{renderContent()}</div>
    </div>
  )
}
