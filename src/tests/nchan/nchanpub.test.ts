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

  it("should construct with correct publish URLs", () => {
    expect(pub["lobbyPublishUrl"]).toContain(
      `billiards-network.onrender.com/publish/lobby/${channel}`
    )
    expect(pub["presencePublishUrl"]).toContain(
      `billiards-network.onrender.com/publish/presence/${channel}`
    )
  })

  it("post should send data to the correct URL (lobby)", async () => {
    const event = { type: "test" }
      ; (globalThis.fetch as jest.Mock).mockResolvedValue({
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
      })
    )
    expect(result).toEqual({ success: true })
  })

  it("post should send data to the correct URL (presence)", async () => {
    const event = { type: "test" }
      ; (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      })

    await pub.post(event, "presence")

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `billiards-network.onrender.com/publish/presence/${channel}`
      ),
      expect.objectContaining({
        method: "POST",
      })
    )
  })

  it("publishLobby should add messageType field", async () => {
    const event = { type: "match_created", matchId: "123" }
      ; (globalThis.fetch as jest.Mock).mockResolvedValue({
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
      ; (globalThis.fetch as jest.Mock).mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      })

    await pub.publishPresence(event)

    const callArgs = (globalThis.fetch as jest.Mock).mock.calls[0]
    const sentBody = JSON.parse(callArgs[1].body)

    expect(sentBody).toEqual({
      ...event,
      messageType: "presence",
    })
  })

  it("get should fetch active connections", async () => {
    const mockText = "Active connections: 42"
      ; (globalThis.fetch as jest.Mock).mockResolvedValue({
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
    ; (globalThis.fetch as jest.Mock).mockResolvedValue({
      text: jest.fn().mockResolvedValue("No connections info here"),
    })

    const connections = await pub.get()

    expect(connections).toBe(0)
  })

  it("getSubscriberCount should return subscribers from nchan info", async () => {
    ; (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ subscribers: 10 }),
    })

    const count = await pub.getSubscriberCount("presence")

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/publish/presence/"),
      expect.objectContaining({
        method: "POST",
        headers: { Accept: "application/json" },
      })
    )
    expect(count).toBe(10)
  })
})
