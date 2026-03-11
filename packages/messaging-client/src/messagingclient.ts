import { NchanClient } from "./nchanclient";
import { Lobby, LobbyOptions } from "./lobby";
import { Table } from "./table";
import { PresenceMessage } from "./types";

/**
 * The main messaging client library entry point.
 * Encapsulates transport logic and provides access to lobby and table functionality.
 */
export class MessagingClient {
  private readonly nchan: NchanClient;
  private activeLobbies: Lobby[] = [];
  private activeTables: Table[] = [];
  private lastLobbyConfig?: { user: PresenceMessage; options?: LobbyOptions };

  constructor(options: { baseUrl: string }) {
    this.nchan = new NchanClient(options.baseUrl);
  }

  /**
   * Initializes the client and ensures connection readiness.
   * In browser environments, attaches lifecycle event listeners.
   */
  async start(): Promise<void> {
    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener("pagehide", this.handlePageHide);
      globalThis.window.addEventListener("pageshow", this.handlePageShow);
      globalThis.document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  /**
   * Stops all active connections and cleans up.
   */
  async stop(): Promise<void> {
    if (globalThis.window !== undefined) {
      globalThis.window.removeEventListener("pagehide", this.handlePageHide);
      globalThis.window.removeEventListener("pageshow", this.handlePageShow);
      globalThis.document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }

    await Promise.all(this.activeLobbies.map((lobby) => lobby.leave()));
    this.activeLobbies = [];

    // Use for loop to await each table leave
    for (const table of this.activeTables) {
      await table.leave();
    }
    this.activeTables = [];
  }

  /**
   * Enters the global lobby for presence broadcasting and tracking.
   */
  async joinLobby(user: PresenceMessage, options?: LobbyOptions): Promise<Lobby> {
    this.lastLobbyConfig = { user, options };
    const lobby = new Lobby(this.nchan, user, options);
    await lobby.join();
    this.activeLobbies.push(lobby);
    return lobby;
  }

  /**
   * Joins a specific table for communication.
   */
  async joinTable<T = any>(tableId: string, userId: string): Promise<Table<T>> {
    let table = this.activeTables.find((t) => t.tableId === tableId) as Table<T>;

    if (table) {
      console.log(`MessagingClient [${userId}] reusing existing Table ${tableId}`);
    } else {
      const lobby = this.activeLobbies.find((l) => l.currentUser.userId === userId);
      console.log(`MessagingClient [${userId}] creating new Table ${tableId}`);
      table = new Table<T>(this.nchan, tableId, userId, lobby);
      this.activeTables.push(table);

      if (lobby) {
        await lobby.updatePresence({ tableId });
      }
    }

    await table.join();
    // Ensure the subscription has had a moment to actually connect
    await new Promise((r) => setTimeout(r, 100));
    return table;
  }

  private readonly handlePageHide = (): void => {
    // Stop all connections on page hide (prevent ghosting)
    this.stop();
  };

  private readonly handlePageShow = (event: PageTransitionEvent): void => {
    // If returning via bfcache, restore connections
    if (event.persisted && this.lastLobbyConfig) {
      this.joinLobby(this.lastLobbyConfig.user, this.lastLobbyConfig.options);
    }
  };

  private readonly handleVisibilityChange = (): void => {
    if (globalThis.document.hidden) {
      this.activeLobbies.forEach((l) => l.pauseHeartbeat());
    } else {
      this.activeLobbies.forEach((l) => l.resumeHeartbeat());
    }
  };
}
