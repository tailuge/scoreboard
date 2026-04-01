import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ServerStatsPopover } from "../components/ServerStatsPopover"

describe("ServerStatsPopover", () => {
  const mockStats = {
    uptime: {
      days: 1,
      hours: 2,
      mins: 3,
      seconds: 4,
    },
    ip_cache: {
      "127.0.0.1": "US|California",
      "127.x.x.1": "GB|London",
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStats),
      })
    )

    // Mock navigator.share and navigator.clipboard
    Object.defineProperty(globalThis.navigator, "share", {
      value: jest.fn().mockResolvedValue(undefined),
      configurable: true,
      writable: true,
    })
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    })
  })

  it("renders children and remains closed initially", () => {
    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )
    expect(screen.getByText("Trigger")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("opens popover when trigger is clicked and fetches stats", async () => {
    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )

    fireEvent.click(screen.getByText("Trigger"))

    expect(screen.getByRole("dialog")).toHaveClass("absolute", "right-0")
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("1d 2h 3m")).toBeInTheDocument()
    })

    expect(screen.getByText("US")).toBeInTheDocument()
    expect(screen.getByText("GB")).toBeInTheDocument()
  })

  it("handles fetch error", async () => {
    globalThis.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    )

    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )

    fireEvent.click(screen.getByText("Trigger"))

    await waitFor(() => {
      expect(screen.getByText(/HTTP 500/i)).toBeInTheDocument()
    })
  })

  it("closes when close button is clicked", async () => {
    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )

    fireEvent.click(screen.getByText("Trigger"))
    await waitFor(() =>
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole("button", { name: /close/i }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("shares URL when share button is clicked (using navigator.share)", async () => {
    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )

    fireEvent.click(screen.getByText("Trigger"))
    await waitFor(() =>
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole("button", { name: /share/i }))

    expect(globalThis.navigator.share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Billiards Scoreboard",
        url: expect.any(String),
      })
    )
  })

  it("copies URL to clipboard if navigator.share is not available", async () => {
    // Redefine navigator.share as undefined
    Object.defineProperty(globalThis.navigator, "share", {
      value: undefined,
      configurable: true,
    })

    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )

    fireEvent.click(screen.getByText("Trigger"))
    await waitFor(() =>
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole("button", { name: /share/i }))

    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.any(String)
    )
  })

  it("closes when clicking outside", async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ServerStatsPopover>
          <span>Trigger</span>
        </ServerStatsPopover>
      </div>
    )

    fireEvent.click(screen.getByText("Trigger"))
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument())

    fireEvent.mouseDown(screen.getByTestId("outside"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("formats uptime correctly for just seconds", async () => {
    const shortUptimeStats = {
      ...mockStats,
      uptime: { days: 0, hours: 0, mins: 0, seconds: 45 },
    }
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(shortUptimeStats),
    })

    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )
    fireEvent.click(screen.getByText("Trigger"))
    await waitFor(() => expect(screen.getByText("45s")).toBeInTheDocument())
  })

  it("formats uptime correctly for 0s", async () => {
    const zeroUptimeStats = {
      ...mockStats,
      uptime: { days: 0, hours: 0, mins: 0, seconds: 0 },
    }
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(zeroUptimeStats),
    })

    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )
    fireEvent.click(screen.getByText("Trigger"))
    await waitFor(() => expect(screen.getByText("0s")).toBeInTheDocument())
  })

  it("handles share errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    ;(globalThis.navigator.share as jest.Mock).mockRejectedValue(
      new Error("Share failed")
    )

    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )

    fireEvent.click(screen.getByText("Trigger"))
    await waitFor(() =>
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole("button", { name: /share/i }))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Share failed:",
        expect.any(Error)
      )
    })
    consoleSpy.mockRestore()
  })

  it("contains a link to usage.html", async () => {
    render(
      <ServerStatsPopover>
        <span>Trigger</span>
      </ServerStatsPopover>
    )

    fireEvent.click(screen.getByText("Trigger"))

    await waitFor(() => {
      expect(screen.getByText("1d 2h 3m")).toBeInTheDocument()
    })

    const usageLink = screen.getByRole("link", { name: /usage/i })
    expect(usageLink).toBeInTheDocument()
    expect(usageLink).toHaveAttribute("href", "/usage.html")
  })
})
