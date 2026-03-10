import { GenericContainer, StartedTestContainer } from "testcontainers";
import { MessagingClient } from "../src/messagingclient";
import { PresenceMessage } from "../src/types";

describe("MessagingClient - Phase 1", () => {
  let container: StartedTestContainer;
  let server: string;
  let clients: MessagingClient[] = [];

  beforeAll(async () => {
    container = await new GenericContainer("tailuge/billiards-network:latest")
      .withExposedPorts(8080)
      .withUser("root")
      .start();

    const port = container.getMappedPort(8080);
    server = `localhost:${port}`;
  }, 60000);

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });

  afterEach(async () => {
    await Promise.all(clients.map((c) => c.stop()));
    clients = [];
  });

  const createClient = () => {
    const client = new MessagingClient({ baseUrl: server });
    clients.push(client);
    return client;
  };

  describe("Lobby & Presence", () => {
    it("should track multiple users in the lobby accurately", async () => {
      const clientA = createClient();
      const clientB = createClient();

      const userA: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-a",
        userName: "Alice",
      };

      const userB: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "user-b",
        userName: "Bob",
      };

      // 1. Client A joins lobby
      const lobbyA = await clientA.joinLobby(userA);

      // 2. Client A receives list containing only themselves
      let usersA: PresenceMessage[] = [];
      lobbyA.onUsersChange((u) => (usersA = u));

      // Wait for propagation
      await new Promise((r) => setTimeout(r, 1000));
      expect(usersA.length).toBe(1);
      expect(usersA[0].userId).toBe("user-a");

      // 3. Client B joins lobby
      const lobbyB = await clientB.joinLobby(userB);

      let usersB: PresenceMessage[] = [];
      lobbyB.onUsersChange((u) => (usersB = u));

      // 4. Both clients should see both users
      await new Promise((r) => setTimeout(r, 1500));

      expect(usersA.length).toBe(2);
      expect(usersB.length).toBe(2);

      const userIdsA = usersA.map((u) => u.userId).sort();
      const userIdsB = usersB.map((u) => u.userId).sort();
      expect(userIdsA).toEqual(["user-a", "user-b"]);
      expect(userIdsB).toEqual(["user-a", "user-b"]);

      // 5. Client B leaves explicitly
      await lobbyB.leave();

      // 6. Client A receives list containing only themselves again
      await new Promise((r) => setTimeout(r, 1500));
      expect(usersA.length).toBe(1);
      expect(usersA[0].userId).toBe("user-a");
    });

    it("should update presence metadata correctly", async () => {
      const clientA = createClient();
      const clientB = createClient();

      const lobbyA = await clientA.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "alice",
        userName: "Alice",
      });

      const lobbyB = await clientB.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "bob",
        userName: "Bob",
      });

      let usersB: PresenceMessage[] = [];
      lobbyB.onUsersChange((u) => (usersB = u));

      // Wait for initial join
      await new Promise((r) => setTimeout(r, 1000));

      // Alice updates her username
      await lobbyA.updatePresence({ userName: "Alice Updated" });

      // Wait for update propagation
      await new Promise((r) => setTimeout(r, 1500));

      const aliceInB = usersB.find((u) => u.userId === "alice");
      expect(aliceInB).toBeDefined();
      expect(aliceInB?.userName).toBe("Alice Updated");
    });
  });

  describe("Challenges & Tables (Phase 2)", () => {
    it("should handle a full challenge/accept and table messaging flow", async () => {
      const clientA = createClient();
      const clientB = createClient();

      const lobbyA = await clientA.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "user-a",
        userName: "Alice",
      });

      const lobbyB = await clientB.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "user-b",
        userName: "Bob",
      });

      // 1. Listen for challenges on B
      let receivedChallenge: any = null;
      lobbyB.onChallenge((c) => {
        receivedChallenge = c;
      });

      // 2. A challenges B
      const tableId = await lobbyA.challenge("user-b", "standard");
      expect(tableId).toBeDefined();

      // Wait for challenge to propagate
      await new Promise((r) => setTimeout(r, 1500));
      expect(receivedChallenge).toBeDefined();
      expect(receivedChallenge.challengerId).toBe("user-a");
      expect(receivedChallenge.tableId).toBe(tableId);

      // 3. B accepts challenge
      const tableB = await lobbyB.acceptChallenge(
        receivedChallenge.challengerId,
        receivedChallenge.ruleType,
        receivedChallenge.tableId,
      );

      // A joins the same table (as it created it)
      const tableA = await clientA.joinTable(tableId, "user-a");

      // 4. Test table messaging
      let messageReceivedByB: any = null;
      tableB.onMessage((m) => {
        messageReceivedByB = m;
      });

      await new Promise((r) => setTimeout(r, 500)); // wait for subscription
      await tableA.publish("MOVE", { x: 5, y: 10 });

      await new Promise((r) => setTimeout(r, 1500));
      expect(messageReceivedByB).toBeDefined();
      expect(messageReceivedByB.type).toBe("MOVE");
      expect(messageReceivedByB.data.x).toBe(5);
      expect(messageReceivedByB.senderId).toBe("user-a");
    });

    it("should notify when an opponent leaves the table explicitly", async () => {
      const clientA = createClient();
      const clientB = createClient();

      const tableId = "explicit-table";

      // 1. Bob joins lobby and table first
      await clientB.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "user-b",
        userName: "Bob",
      });
      const tableB = await clientB.joinTable(tableId, "user-b");

      let opponentLeft = false;
      tableB.onOpponentLeft(() => {
        console.log("TEST: Bob detected Alice left");
        opponentLeft = true;
      });

      // Wait for Bob's subscription to be ready
      await new Promise((r) => setTimeout(r, 1000));

      // 2. Alice joins lobby and table
      await clientA.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "user-a",
        userName: "Alice",
      });
      const tableA = await clientA.joinTable(tableId, "user-a");

      // Wait for presence propagation
      await new Promise((r) => setTimeout(r, 1500));

      // 3. Alice leaves the table
      console.log("TEST: Alice calling tableA.leave()");
      await tableA.leave();

      // Bob should be notified
      await new Promise((r) => setTimeout(r, 2000));
      expect(opponentLeft).toBe(true);
    }, 10000);

    it("should notify when an opponent disconnects (Watchdog)", async () => {
      const clientA = createClient();
      const clientB = createClient();

      const tableId = "watchdog-table";

      // 1. Bob joins lobby and table
      await clientB.joinLobby(
        {
          messageType: "presence",
          type: "join",
          userId: "user-b",
          userName: "Bob",
        },
        {
          pruneInterval: 500,
          staleTtl: 2000,
        },
      );
      const tableB = await clientB.joinTable(tableId, "user-b");

      let opponentLeft = false;
      tableB.onOpponentLeft(() => {
        console.log("TEST: Bob watchdog detected Alice left");
        opponentLeft = true;
      });

      // Wait for Bob to be ready
      await new Promise((r) => setTimeout(r, 1000));

      // 2. Alice joins lobby and table
      const lobbyA = await clientA.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "user-a",
        userName: "Alice",
      });
      await clientA.joinTable(tableId, "user-a");

      // Wait for presence propagation
      await new Promise((r) => setTimeout(r, 1500));

      // 3. Simulate Alice crashing (stop heartbeats without leave)
      console.log("TEST: Alice crashing (stopping heartbeats)");
      (lobbyA as any).stopHeartbeat();
      (lobbyA as any).stopPruning();

      // Bob's watchdog should detect Alice is gone from lobby
      await new Promise((r) => setTimeout(r, 6000));
      expect(opponentLeft).toBe(true);
    }, 15000);

    it("should handle challenge decline", async () => {
      // ... (unchanged)
    });
  });

  describe("Reliability (Phase 3)", () => {
    it("should prune a client who stops heartbeating", async () => {
      const clientA = createClient();
      const clientB = createClient();

      // Client A tracks with very aggressive pruning for the test
      const lobbyA = await clientA.joinLobby(
        {
          messageType: "presence",
          type: "join",
          userId: "alice",
          userName: "Alice",
        },
        {
          pruneInterval: 500,
          staleTtl: 2000,
        },
      );

      const lobbyB = await clientB.joinLobby({
        messageType: "presence",
        type: "join",
        userId: "bob",
        userName: "Bob",
      });

      let usersA: PresenceMessage[] = [];
      lobbyA.onUsersChange((u) => (usersA = u));

      // 1. Both see each other
      await new Promise((r) => setTimeout(r, 1500));
      expect(usersA.find((u) => u.userId === "bob")).toBeDefined();

      // 2. Bob "crashes"
      (lobbyB as any).stopHeartbeat();
      (lobbyB as any).stopPruning();

      // 3. Wait for A to prune Bob (staleTtl = 2000ms)
      await new Promise((r) => setTimeout(r, 4000));

      expect(usersA.find((u) => u.userId === "bob")).toBeUndefined();
      expect(usersA.length).toBe(1); // Only Alice remains
    }, 10000);
  });
});
