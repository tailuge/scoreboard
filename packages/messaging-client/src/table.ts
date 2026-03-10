import { NchanClient, Subscription } from "./nchanclient";
import { TableMessage, parseMessage, PresenceMessage } from "./types";
import { Lobby } from "./lobby";

/**
 * Represents a specific communication channel for a 2-player/spectator scenario at a table.
 */
export class Table<T = any> {
  private subscription: Subscription | null = null;
  private messageListeners: ((event: TableMessage<T>) => void)[] = [];
  private spectatorListeners: ((spectators: PresenceMessage[]) => void)[] = [];
  private opponentLeftListeners: (() => void)[] = [];
  private lobbyUnsubscribe?: () => void;

  public opponentLeft = false;
  private opponentSeen = false;

  constructor(
    private nchan: NchanClient,
    public readonly tableId: string,
    private userId: string,
    private lobby?: Lobby,
  ) {
    if (this.lobby) {
      const handler = (users: PresenceMessage[]) => this.handleLobbyUsersChange(users);
      this.lobby.onUsersChange(handler);
      this.lobbyUnsubscribe = () => {
        this.lobby?.offUsersChange(handler);
      };
    }
  }

  /**
   * Initializes the table by subscribing to its specific channel.
   */
  async join(): Promise<void> {
    this.subscription = this.nchan.subscribeTable(this.tableId, (data) => {
      this.handleIncomingMessage(data);
    });
  }

  /**
   * Broadcast an event to all participants at the table.
   */
  async publish(type: string, data: T): Promise<void> {
    await this.nchan.publishTable(this.tableId, { type, data }, this.userId);
  }

  /**
   * Subscribe to events published by other participants.
   */
  onMessage(callback: (event: TableMessage<T>) => void): void {
    this.messageListeners.push(callback);
  }

  /**
   * Subscribe to opponent departure (explicit leave or timeout).
   */
  onOpponentLeft(callback: () => void): void {
    this.opponentLeftListeners.push(callback);
    if (this.opponentLeft) {
      callback();
    }
  }

  /**
   * Subscribe to changes in the spectator list.
   * Note: In a real implementation, this would track presence messages on the table channel.
   */
  onSpectatorChange(callback: (spectators: PresenceMessage[]) => void): void {
    this.spectatorListeners.push(callback);
  }

  /**
   * Leave the table and stop all subscriptions.
   */
  async leave(): Promise<void> {
    try {
      // Explicitly notify the opponent we are leaving
      await this.publish("SYSTEM_DISCONNECT", {} as T);
      // Small delay to ensure the message is dispatched before closing the socket
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      console.error("Error leaving table:", e);
    }

    // Clear lobby presence if we have one
    if (this.lobby) {
      await this.lobby.updatePresence({ tableId: undefined });
    }

    this.subscription?.stop();
    this.messageListeners = [];
    this.spectatorListeners = [];
    this.opponentLeftListeners = [];
    this.lobbyUnsubscribe?.();
  }

  private handleIncomingMessage(data: string): void {
    const msg = parseMessage<TableMessage<T>>(data);
    if (!msg || !msg.type) return;

    // Handle system messages internally
    if (msg.type === "SYSTEM_DISCONNECT" && msg.senderId !== this.userId) {
      this.notifyOpponentLeft();
    }

    // Notify message listeners
    this.messageListeners.forEach((cb) => cb(msg));
  }

  private handleLobbyUsersChange(users: PresenceMessage[]): void {
    const playersAtThisTable = users.filter((u) => u.tableId === this.tableId);
    const opponent = playersAtThisTable.find((u) => u.userId !== this.userId);

    if (opponent) {
      this.opponentSeen = true;
    }

    // Watchdog trigger: Opponent was here, but now is gone.
    if (this.opponentSeen && !opponent) {
      this.notifyOpponentLeft();
    }
  }

  private notifyOpponentLeft(): void {
    if (this.opponentLeft) return; // Only notify once
    this.opponentLeft = true;
    this.opponentLeftListeners.forEach((cb) => cb());
  }
}
