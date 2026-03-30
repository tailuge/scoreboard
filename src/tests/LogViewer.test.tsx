import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import LogViewer from "@/components/LogViewer"
import type { SessionEntry } from "@/types/client-log"

const mockSessions: SessionEntry[] = [
  {
    sid: "session1",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ts: Date.now(),
    city: "New York",
    country: "US",
    region: "iad1",
    version: "1.0.0",
    origin: "https://example.com",
    logs: [
      {
        type: "error",
        message: "Something went wrong",
        ts: Date.now(),
        sid: "session1",
      },
      {
        type: "warn",
        message: "Be careful",
        ts: Date.now() + 1000,
        sid: "session1",
      },
    ],
  },
  {
    sid: "session2",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ts: Date.now() - 3600000,
    city: "London",
    country: "GB",
    region: "lhr1",
    logs: [
      {
        type: "uncaught",
        message: "Uncaught error",
        stack: "Error: Uncaught error\n    at <anonymous>:1:1",
        ts: Date.now() - 3600000,
        sid: "session2",
      },
    ],
  },
]

describe("LogViewer", () => {
  it("renders 'No logs yet' when sessions are empty", () => {
    render(<LogViewer sessions={[]} />)
    expect(screen.getByText(/No logs yet/i)).toBeInTheDocument()
  })

  it("renders session list", () => {
    render(<LogViewer sessions={mockSessions} />)
    expect(screen.getByText("session1")).toBeInTheDocument()
    expect(screen.getByText("session2")).toBeInTheDocument()
    // Check for OS and Browser icons/names
    expect(screen.getAllByText(/Windows/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Chrome/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/iOS/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Safari/).length).toBeGreaterThan(0)
    // Check for location details
    expect(screen.getByText(/New York/)).toBeInTheDocument()
    expect(screen.getByText(/London/)).toBeInTheDocument()
    expect(screen.getByText("(iad1)")).toBeInTheDocument()
    expect(screen.getByText("(lhr1)")).toBeInTheDocument()
    // Check for version and origin
    expect(screen.getByText("v1.0.0")).toBeInTheDocument()
    expect(screen.getByText("example.com")).toBeInTheDocument()
  })

  it("shows logs when a session is selected", () => {
    render(<LogViewer sessions={mockSessions} />)

    // Select first session
    fireEvent.click(screen.getByText("session1"))

    expect(screen.getByText("Logs for session1")).toBeInTheDocument()
    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    expect(screen.getByText("Be careful")).toBeInTheDocument()
    expect(screen.getByText("error")).toBeInTheDocument()
    expect(screen.getByText("warn")).toBeInTheDocument()
  })

  it("shows stack trace when available", () => {
    render(<LogViewer sessions={mockSessions} />)

    // Select second session
    fireEvent.click(screen.getByText("session2"))

    expect(screen.getByText("Uncaught error")).toBeInTheDocument()
    expect(screen.getByText(/at <anonymous>:1:1/)).toBeInTheDocument()
  })

  it("uses default color for unknown log types", () => {
    const sessionWithUnknownType: SessionEntry = {
      ...mockSessions[0],
      sid: "session3",
      logs: [
        {
          type: "unknown",
          message: "unknown message",
          ts: Date.now(),
          sid: "session3",
        },
      ],
    }
    render(<LogViewer sessions={[sessionWithUnknownType]} />)
    fireEvent.click(screen.getByText("session3"))
    const typeSpan = screen.getByText("unknown")
    expect(typeSpan.style.color).toBe("blue")
  })

  it("uses log region if session region is missing", () => {
    const sessionWithNoRegion: SessionEntry = {
      ...mockSessions[0],
      sid: "session4",
      region: undefined,
      logs: [{ ...mockSessions[0].logs[0], region: "fallback-region" }],
    }
    render(<LogViewer sessions={[sessionWithNoRegion]} />)
    expect(screen.getByText("(fallback-region)")).toBeInTheDocument()
  })

  it("shows 'Select a session' message when no session is selected", () => {
    render(<LogViewer sessions={mockSessions} />)
    expect(
      screen.getByText(/Select a session to view logs/i)
    ).toBeInTheDocument()
  })
})
