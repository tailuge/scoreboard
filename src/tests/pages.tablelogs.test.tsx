import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import TableLogs from "@/pages/tablelogs"
import { useRouter } from "next/router"

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}))

// Mock nchan/nchansub
let mockNchanCallback: (message: string) => void = () => {}
const mockNchanStop = jest.fn()
jest.mock("@/nchan/nchansub", () => ({
  NchanSub: jest.fn().mockImplementation((tableId, callback) => ({
    start: jest.fn(() => {
      mockNchanCallback = callback
    }),
    stop: mockNchanStop,
  })),
}))

describe("TableLogs Component", () => {
  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue({
      query: { tableId: "test-table-123" },
    })
    jest.clearAllMocks()
    mockNchanStop.mockClear()
  })

  it("renders the component with the tableId", () => {
    render(<TableLogs />)
    expect(
      screen.getByText("Logs for Table test-table-123")
    ).toBeInTheDocument()
  })

  it("displays a received message", async () => {
    render(<TableLogs />)
    const message = { clientId: "client-1", type: "TEST" }
    act(() => {
      mockNchanCallback(JSON.stringify(message))
    })
    await waitFor(() => {
      expect(screen.getByText("client-1 TEST")).toBeInTheDocument()
    })
  })

  it("toggles the display of the full JSON content when a message is clicked", async () => {
    render(<TableLogs />)
    const message = { clientId: "client-1", type: "TEST" }
    act(() => {
      mockNchanCallback(JSON.stringify(message))
    })
    const messageElement = await screen.findByText("client-1 TEST")
    fireEvent.click(messageElement)
    await waitFor(() => {
      const expectedJson = JSON.stringify(message, null, 2)
      const jsonElement = screen.queryByText((_content, element) => {
        return element?.textContent === expectedJson
      })
      expect(jsonElement).toBeInTheDocument()
    })
    fireEvent.click(messageElement)
    await waitFor(() => {
      const expectedJson = JSON.stringify(message, null, 2)
      const jsonElement = screen.queryByText((_content, element) => {
        return element?.textContent === expectedJson
      })
      expect(jsonElement).not.toBeInTheDocument()
    })
  })

  it("filters consecutive AIM messages", async () => {
    render(<TableLogs />)
    const message1 = { clientId: "client-1", type: "AIM" }
    const message2 = { clientId: "client-1", type: "AIM" }
    const message3 = { clientId: "client-1", type: "OTHER" }
    act(() => {
      mockNchanCallback(JSON.stringify(message1))
      mockNchanCallback(JSON.stringify(message2))
      mockNchanCallback(JSON.stringify(message3))
    })

    await waitFor(() => {
      const aimMessages = screen.queryAllByText("client-1 AIM")
      expect(aimMessages.length).toBe(1)
      expect(screen.getByText("client-1 OTHER")).toBeInTheDocument()
    })
  })

  it("handles invalid JSON messages gracefully", async () => {
    render(<TableLogs />)
    const invalidJson = "this is not json"
    act(() => {
      mockNchanCallback(invalidJson)
    })
    await waitFor(() => {
      expect(
        screen.getByText(`Invalid JSON: ${invalidJson}`)
      ).toBeInTheDocument()
    })
  })

  it("stops the NchanSub connection on component unmount", () => {
    const { unmount } = render(<TableLogs />)
    unmount()
    expect(mockNchanStop).toHaveBeenCalled()
  })
})
