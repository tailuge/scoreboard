import { NchanClient, Subscription } from "./nchanclient";
import { PresenceMessage, ChallengeMessage, parseMessage } from "./types";
import { Table } from "./table";
import { getUID } from "./utils/uid";

export interface LobbyOptions {
  heartbeatInterval?: number;
  pruneInterval?: number;
  staleTtl?: number;
}

/**
 * Manages the global lobby state, including real-time presence tracking and challenge flows.
 */
export class Lobby {
  private users = new Map<string, PresenceMessage>();
  private listeners: ((users: PresenceMessage[]) => void)[] = [];
  private challengeListeners: ((challenge: ChallengeMessage) => void)[] = [];
  private subscription: Subscription | null = null;

  private heartbeatTimer?: any;
  private pruneTimer?: any;

  private readonly heartbeatInterval: number;
  private readonly pruneInterval: number;
  private readonly staleTtl: number;

  constructor(
    private nchan: NchanClient,
    public currentUser: PresenceMessage,
    options: LobbyOptions = {},
  ) {
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.pruneInterval = options.pruneInterval || 10000;
    this.staleTtl = options.staleTtl || 90000;
  }

  /**
   * Initializes the lobby by subscribing to presence events and broadcasting "join".
   */
  async join(): Promise<void> {
    this.subscription = this.nchan.subscribePresence((data) => {
      this.handleIncomingMessage(data);
    });

    // Broadcast our own presence
    await this.nchan.publishPresence(this.currentUser);

    this.startHeartbeat();
    this.startPruning();
  }

  /**
   * Pauses the heartbeat timer (e.g. when tab is hidden).
   */
  pauseHeartbeat(): void {
    this.stopHeartbeat();
  }

  /**
   * Resumes the heartbeat timer (e.g. when tab becomes visible).
   */
  resumeHeartbeat(): void {
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.nchan.publishPresence({
          ...this.currentUser,
          type: "heartbeat",
        });
      } catch (_e) {
        console.error("Failed to send heartbeat:", _e);
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  private startPruning(): void {
    this.stopPruning();
    this.pruneTimer = setInterval(() => {
      const now = Date.now();
      let changed = false;

      for (const [userId, user] of this.users.entries()) {
        if (userId === this.currentUser.userId) continue;

        // Use lastSeen (ms) or fall back to current time if just joined
        const lastSeen = user.lastSeen || now;
        if (now - lastSeen > this.staleTtl) {
          this.users.delete(userId);
          changed = true;
        }
      }

      if (changed) {
        this.notifyListeners();
      }
    }, this.pruneInterval);
  }

  private stopPruning(): void {
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = undefined;
    }
  }

  /**
   * Emits the current list of online users whenever it changes.
   */
  onUsersChange(callback: (users: PresenceMessage[]) => void): void {
    this.listeners.push(callback);
    // Immediate emit of current state to the new listener
    callback(this.getUsersList());
  }

  /**
   * Stop listening to user changes.
   */
  offUsersChange(callback: (users: PresenceMessage[]) => void): void {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  /**
   * Allows updating the current user's status (e.g. name or playing state).
   */
  async updatePresence(update: Partial<PresenceMessage>): Promise<void> {
    this.currentUser = { ...this.currentUser, ...update };
    await this.nchan.publishPresence(this.currentUser);
  }

  /**
   * Challenge another user to a game.
   * Returns the ID of the table created for the challenge.
   */
  async challenge(userId: string, ruleType: string): Promise<string> {
    const tableId = getUID();
    await this.nchan.publishChallenge({
      type: "offer",
      challengerId: this.currentUser.userId,
      challengerName: this.currentUser.userName,
      recipientId: userId,
      ruleType,
      tableId,
    });
    return tableId;
  }

  /**
   * Accept an incoming challenge.
   * Returns the Table instance for the accepted game.
   */
  async acceptChallenge(userId: string, ruleType: string, tableId: string): Promise<Table> {
    await this.nchan.publishChallenge({
      type: "accept",
      challengerId: this.currentUser.userId,
      challengerName: this.currentUser.userName,
      recipientId: userId,
      ruleType,
      tableId,
    });

    // Automatically update our presence to show we've joined the table
    await this.updatePresence({ tableId });

    const table = new Table(this.nchan, tableId, this.currentUser.userId, this);
    await table.join();
    return table;
  }

  /**
   * Decline an incoming challenge.
   */
  async declineChallenge(userId: string, ruleType: string): Promise<void> {
    await this.nchan.publishChallenge({
      type: "decline",
      challengerId: this.currentUser.userId,
      challengerName: this.currentUser.userName,
      recipientId: userId,
      ruleType,
    });
  }

  /**
   * Cancel an outgoing challenge.
   */
  async cancelChallenge(userId: string, ruleType: string): Promise<void> {
    await this.nchan.publishChallenge({
      type: "cancel",
      challengerId: this.currentUser.userId,
      challengerName: this.currentUser.userName,
      recipientId: userId,
      ruleType,
    });
  }

  /**
   * Subscribe to incoming challenges directed at the current user.
   */
  onChallenge(callback: (challenge: ChallengeMessage) => void): void {
    this.challengeListeners.push(callback);
  }

  /**
   * Gracefully leaves the lobby.
   */
  async leave(): Promise<void> {
    this.stopHeartbeat();
    this.stopPruning();
    this.subscription?.stop();

    try {
      await this.nchan.publishPresence({
        ...this.currentUser,
        type: "leave",
      });
    } catch (e) {
      console.error("Error leaving lobby:", e);
    }

    this.users.clear();
    this.notifyListeners();
  }

  private handleIncomingMessage(data: string): void {
    const rawMsg = parseMessage<any>(data);
    if (!rawMsg) return;

    if (rawMsg.messageType === "presence") {
      this.handlePresenceUpdate(rawMsg as PresenceMessage);
    } else if (rawMsg.messageType === "challenge") {
      this.handleChallenge(rawMsg as ChallengeMessage);
    }
  }

  private handlePresenceUpdate(msg: PresenceMessage): void {
    if (msg.type === "leave") {
      this.users.delete(msg.userId);
    } else {
      // Use local time for real-time pruning to avoid clock skew
      msg.lastSeen = Date.now();
      this.users.set(msg.userId, msg);
    }
    this.notifyListeners();
  }

  private handleChallenge(msg: ChallengeMessage): void {
    // Filter messages directed at us (or broadcasted ones)
    if (msg.recipientId === this.currentUser.userId) {
      this.challengeListeners.forEach((cb) => cb(msg));
    }
  }

  private notifyListeners(): void {
    const list = this.getUsersList();
    this.listeners.forEach((cb) => cb(list));
  }

  private getUsersList(): PresenceMessage[] {
    return Array.from(this.users.values());
  }
}
