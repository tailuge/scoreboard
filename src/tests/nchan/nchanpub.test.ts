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
})
