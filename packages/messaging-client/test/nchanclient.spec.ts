import { GenericContainer, StartedTestContainer } from "testcontainers";
import WebSocket from "ws";
import { NchanClient } from "../src/nchanclient";

/**
 * Helper to verify _meta enrichment in a parsed message.
 * Asserts that _meta exists, ts is a valid ISO date, method is POST,
 * and path contains the expected prefix.
 */
function expectMeta(parsed: Record<string, unknown>, pathPrefix: string) {
  expect(parsed._meta).toBeDefined();
  const meta = parsed._meta as Record<string, unknown>;
  expect(meta.ts).toBeDefined();
  expect(typeof meta.ts).toBe("string");
  expect(Date.parse(meta.ts as string)).not.toBeNaN();
  expect(meta.method).toBe("POST");
  expect(meta.path).toContain(pathPrefix);
}

describe("NchanClient", () => {
  let container: StartedTestContainer;
  let port: number;
  let server: string;

  beforeAll(async () => {
    container = await new GenericContainer("tailuge/billiards-network:latest")
      .withExposedPorts(8080)
      .withUser("root")
      .start();

    port = container.getMappedPort(8080);
    server = `localhost:${port}`;
  }, 60000);

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  describe("publishPresence", () => {
    it("should publish presence message to nchan ", async () => {
      const client = new NchanClient(server);

      await expect(
        client.publishPresence({
          type: "join",
          userId: "presence-publish-test",
          userName: "PresencePublishTest",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("publishChallenge", () => {
    it("should publish challenge message to nchan ", async () => {
      const client = new NchanClient(server);

      await expect(
        client.publishChallenge({
          type: "offer",
          challengerId: "user1",
          challengerName: "User 1",
          recipientId: "user2",
          ruleType: "standard",
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("publishTable", () => {
    it("should publish table message to nchan ", async () => {
      const client = new NchanClient(server);

      await expect(
        client.publishTable(
          "table99",
          {
            type: "MOVE",
            data: { x: 1, y: 2 },
          },
          "user123",
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("subscribePresence", () => {
    it("should subscribe to presence channel and receive messages ", async () => {
      const client = new NchanClient(server);
      const messages: string[] = [];
      const targetUserId = "presence-sub-test-" + Date.now();

      const subscription = client.subscribePresence((data) => {
        messages.push(data);
      });

      // Wait for WS to connect
      await new Promise((resolve) => setTimeout(resolve, 500));

      await client.publishPresence({
        type: "join",
        userId: targetUserId,
        userName: "PresenceSubTest",
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      subscription.stop();

      expect(messages.length).toBeGreaterThan(0);
      const recentMessage = messages.reverse().find((m) => {
        const parsed = JSON.parse(m);
        return parsed.userId === targetUserId;
      });
      expect(recentMessage).toBeDefined();
      const parsed = JSON.parse(recentMessage!);
      expect(parsed.messageType).toBe("presence");
      expect(parsed.type).toBe("join");
      expect(parsed.userId).toBe(targetUserId);

      expectMeta(parsed, "/publish/presence/");
    });

    it("should receive challenge messages on presence channel", async () => {
      const client = new NchanClient(server);
      const messages: string[] = [];
      const recipientId = "recipient-" + Date.now();

      const subscription = client.subscribePresence((data) => {
        messages.push(data);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      await client.publishChallenge({
        type: "offer",
        challengerId: "challenger1",
        challengerName: "Challenger 1",
        recipientId,
        ruleType: "standard",
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      subscription.stop();

      const recentMessage = messages.reverse().find((m) => {
        const parsed = JSON.parse(m);
        return parsed.recipientId === recipientId;
      });
      expect(recentMessage).toBeDefined();
      const parsed = JSON.parse(recentMessage!);
      expect(parsed.messageType).toBe("challenge");
      expect(parsed.type).toBe("offer");
    });
  });

  describe("subscribeTable", () => {
    it("should subscribe to table channel and receive messages ", async () => {
      const client = new NchanClient(server);
      const messages: string[] = [];
      const tableId = "testtable" + Date.now();

      const subscription = client.subscribeTable(tableId, (data) => {
        messages.push(data);
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      await client.publishTable(
        tableId,
        {
          type: "MOVE",
          data: { x: 10, y: 20 },
        },
        "user456",
      );

      await new Promise((resolve) => setTimeout(resolve, 1500));

      subscription.stop();

      expect(messages.length).toBeGreaterThan(0);
      const parsed = JSON.parse(messages[0]);
      expect(parsed.type).toBe("MOVE");
      expect(parsed.senderId).toBe("user456");
      expect(parsed.data.x).toBe(10);
      expectMeta(parsed, `/publish/table/${tableId}`);
    });
  });

  describe("WebSocket connection", () => {
    it("should connect to nchan websocket", (done) => {
      const ws = new WebSocket(`ws://localhost:${port}/subscribe/presence/lobby`);

      ws.on("open", () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on("error", (error) => {
        done(error);
      });
    });
  });
});
