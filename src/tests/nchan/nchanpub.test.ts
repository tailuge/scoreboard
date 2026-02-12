import { NchanPub } from "../../nchan/nchanpub"

describe("NchanPub", () => {
  let pub: NchanPub
  const channel = "test-channel"

  beforeEach(() => {
    pub = new NchanPub(channel)
    // Mock globalThis.fetch
    globalThis.fetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("should construct with correct publishUrl", () => {
    expect(pub["publishUrl"]).toContain(
      `billiards-network.onrender.com/publish/lobby/${channel}`
    )
  })

  it("post should send data to the correct URL", async () => {
    const event = { type: "test" }
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    })

    const result = await pub.post(event)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `billiards-network.onrender.com/publish/lobby/${channel}`
      ),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
    )
    expect(result).toEqual({ success: true })
  })

  it("publishLobby should add messageType field", async () => {
    const event = { type: "match_created", matchId: "123" }
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    })

    await pub.publishLobby(event)

    const callArgs = (globalThis.fetch as jest.Mock).mock.calls[0]
    const sentBody = JSON.parse(callArgs[1].body)

    expect(sentBody).toEqual({
      ...event,
      messageType: "lobby",
    })
  })

  it("publishPresence should add messageType field", async () => {
    const event = {
      type: "join" as const,
      userId: "user123",
      userName: "TestUser",
    }
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    })

    await pub.publishPresence(event)

    const callArgs = (globalThis.fetch as jest.Mock).mock.calls[0]
    expect(callArgs[0]).toContain(
      `billiards-network.onrender.com/publish/presence/${channel}`
    )
    const sentBody = JSON.parse(callArgs[1].body)

    expect(sentBody).toEqual({
      ...event,
      messageType: "presence",
    })
  })

  it("get should fetch active connections", async () => {
    const mockText = "Active connections: 42"
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      text: jest.fn().mockResolvedValue(mockText),
    })

    const connections = await pub.get()

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("billiards-network.onrender.com/basic_status"),
      expect.objectContaining({
        method: "GET",
        mode: "cors",
      })
    )
    // The code does lines - 1
    expect(connections).toBe(41)
  })

  it("get should return 0 if regex does not match", async () => {
    ;(globalThis.fetch as jest.Mock).mockResolvedValue({
      text: jest.fn().mockResolvedValue("No connections info here"),
    })

    const connections = await pub.get()

    expect(connections).toBe(0)
  })
})
