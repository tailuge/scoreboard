var MessagingLib = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/messagingclient.ts
  var messagingclient_exports = {};
  __export(messagingclient_exports, {
    MessagingClient: () => MessagingClient
  });

  // src/nchanclient.ts
  var NchanClient = class {
    server;
    constructor(server) {
      this.server = server.replace(/\/$/, "");
      if (!this.server.startsWith("http")) {
        this.server = `http://${this.server}`;
      }
    }
    getWsUrl(path) {
      return this.server.replace(/^http/, "ws") + path;
    }
    getHttpUrl(path) {
      return this.server + path;
    }
    async publish(path, message) {
      const url = this.getHttpUrl(path);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message)
      });
      if (!response.ok) {
        throw new Error(`Publish failed: ${response.status}`);
      }
      return response;
    }
    // Publishing
    async publishPresence(message) {
      return this.publish("/publish/presence/lobby", {
        ...message,
        messageType: "presence"
      });
    }
    async publishChallenge(message) {
      return this.publish("/publish/presence/lobby", {
        ...message,
        messageType: "challenge"
      });
    }
    async publishTable(tableId, message, senderId) {
      return this.publish(`/publish/table/${tableId}`, {
        ...message,
        senderId
      });
    }
    // Subscribing
    subscribePresence(onMessage) {
      return this.subscribe("/subscribe/presence/lobby", onMessage);
    }
    subscribeTable(tableId, onMessage) {
      return this.subscribe(`/subscribe/table/${tableId}`, onMessage);
    }
    subscribe(path, onMessage) {
      const url = this.getWsUrl(path);
      let ws = null;
      let stopped = false;
      let reconnectAttempts = 0;
      const maxReconnectDelay = 3e4;
      const connect = () => {
        if (stopped) return;
        ws = new globalThis.WebSocket(url);
        ws.onmessage = (event) => {
          onMessage(event.data);
        };
        ws.onopen = () => {
          reconnectAttempts = 0;
        };
        ws.onclose = () => {
          if (!stopped) {
            const delay = Math.min(
              Math.pow(2, reconnectAttempts) * 1e3,
              maxReconnectDelay
            );
            reconnectAttempts++;
            setTimeout(connect, delay);
          }
        };
        ws.onerror = () => {
          ws?.close();
        };
      };
      connect();
      return {
        stop: () => {
          stopped = true;
          ws?.close();
        }
      };
    }
  };

  // src/types.ts
  function parseMessage(data) {
    if (!data || data.trim() === "") return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse Nchan message:", e);
      return null;
    }
  }

  // src/table.ts
  var Table = class {
    constructor(nchan, tableId, userId) {
      this.nchan = nchan;
      this.tableId = tableId;
      this.userId = userId;
    }
    subscription = null;
    messageListeners = [];
    spectatorListeners = [];
    /**
     * Initializes the table by subscribing to its specific channel.
     */
    async join() {
      this.subscription = this.nchan.subscribeTable(this.tableId, (data) => {
        this.handleIncomingMessage(data);
      });
    }
    /**
     * Broadcast an event to all participants at the table.
     */
    async publish(type, data) {
      await this.nchan.publishTable(this.tableId, { type, data }, this.userId);
    }
    /**
     * Subscribe to events published by other participants.
     */
    onMessage(callback) {
      this.messageListeners.push(callback);
    }
    /**
     * Subscribe to changes in the spectator list.
     * Note: In a real implementation, this would track presence messages on the table channel.
     */
    onSpectatorChange(callback) {
      this.spectatorListeners.push(callback);
    }
    /**
     * Leave the table and stop all subscriptions.
     */
    leave() {
      this.subscription?.stop();
      this.messageListeners = [];
      this.spectatorListeners = [];
    }
    handleIncomingMessage(data) {
      const msg = parseMessage(data);
      if (!msg || !msg.type) return;
      this.messageListeners.forEach((cb) => cb(msg));
    }
  };

  // src/utils/uid.ts
  function getUID() {
    return "xxxxxxxx".replace(
      /x/g,
      () => Math.floor(Math.random() * 16).toString(16)
    );
  }

  // src/lobby.ts
  var Lobby = class {
    constructor(nchan, currentUser, options = {}) {
      this.nchan = nchan;
      this.currentUser = currentUser;
      this.heartbeatInterval = options.heartbeatInterval || 3e4;
      this.pruneInterval = options.pruneInterval || 1e4;
      this.staleTtl = options.staleTtl || 9e4;
    }
    users = /* @__PURE__ */ new Map();
    listeners = [];
    challengeListeners = [];
    subscription = null;
    heartbeatTimer;
    pruneTimer;
    heartbeatInterval;
    pruneInterval;
    staleTtl;
    /**
     * Initializes the lobby by subscribing to presence events and broadcasting "join".
     */
    async join() {
      this.subscription = this.nchan.subscribePresence((data) => {
        this.handleIncomingMessage(data);
      });
      await this.nchan.publishPresence(this.currentUser);
      this.startHeartbeat();
      this.startPruning();
    }
    /**
     * Pauses the heartbeat timer (e.g. when tab is hidden).
     */
    pauseHeartbeat() {
      this.stopHeartbeat();
    }
    /**
     * Resumes the heartbeat timer (e.g. when tab becomes visible).
     */
    resumeHeartbeat() {
      this.startHeartbeat();
    }
    startHeartbeat() {
      this.stopHeartbeat();
      this.heartbeatTimer = setInterval(async () => {
        try {
          await this.nchan.publishPresence({
            ...this.currentUser,
            type: "heartbeat"
          });
        } catch (e) {
          console.error("Failed to send heartbeat:", e);
        }
      }, this.heartbeatInterval);
    }
    stopHeartbeat() {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = void 0;
      }
    }
    startPruning() {
      this.stopPruning();
      this.pruneTimer = setInterval(() => {
        const now = Date.now();
        let changed = false;
        for (const [userId, user] of this.users.entries()) {
          if (userId === this.currentUser.userId) continue;
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
    stopPruning() {
      if (this.pruneTimer) {
        clearInterval(this.pruneTimer);
        this.pruneTimer = void 0;
      }
    }
    /**
     * Emits the current list of online users whenever it changes.
     */
    onUsersChange(callback) {
      this.listeners.push(callback);
      callback(this.getUsersList());
    }
    /**
     * Allows updating the current user's status (e.g. name or playing state).
     */
    async updatePresence(update) {
      this.currentUser = { ...this.currentUser, ...update };
      await this.nchan.publishPresence(this.currentUser);
    }
    /**
     * Challenge another user to a game.
     * Returns the ID of the table created for the challenge.
     */
    async challenge(userId, ruleType) {
      const tableId = getUID();
      await this.nchan.publishChallenge({
        type: "offer",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId,
        ruleType,
        tableId
      });
      return tableId;
    }
    /**
     * Accept an incoming challenge.
     * Returns the Table instance for the accepted game.
     */
    async acceptChallenge(userId, ruleType, tableId) {
      await this.nchan.publishChallenge({
        type: "accept",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId,
        ruleType,
        tableId
      });
      const table = new Table(this.nchan, tableId, this.currentUser.userId);
      await table.join();
      return table;
    }
    /**
     * Decline an incoming challenge.
     */
    async declineChallenge(userId, ruleType) {
      await this.nchan.publishChallenge({
        type: "decline",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId,
        ruleType
      });
    }
    /**
     * Cancel an outgoing challenge.
     */
    async cancelChallenge(userId, ruleType) {
      await this.nchan.publishChallenge({
        type: "cancel",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId,
        ruleType
      });
    }
    /**
     * Subscribe to incoming challenges directed at the current user.
     */
    onChallenge(callback) {
      this.challengeListeners.push(callback);
    }
    /**
     * Gracefully leaves the lobby.
     */
    async leave() {
      this.stopHeartbeat();
      this.stopPruning();
      this.subscription?.stop();
      try {
        await this.nchan.publishPresence({
          ...this.currentUser,
          type: "leave"
        });
      } catch (e) {
      }
      this.users.clear();
      this.notifyListeners();
    }
    handleIncomingMessage(data) {
      const rawMsg = parseMessage(data);
      if (!rawMsg) return;
      if (rawMsg.messageType === "presence") {
        this.handlePresenceUpdate(rawMsg);
      } else if (rawMsg.messageType === "challenge") {
        this.handleChallenge(rawMsg);
      }
    }
    handlePresenceUpdate(msg) {
      if (msg.type === "leave") {
        this.users.delete(msg.userId);
      } else {
        if (msg._meta?.ts) {
          msg.lastSeen = Date.parse(msg._meta.ts);
        } else {
          msg.lastSeen = Date.now();
        }
        this.users.set(msg.userId, msg);
      }
      this.notifyListeners();
    }
    handleChallenge(msg) {
      if (msg.recipientId === this.currentUser.userId) {
        this.challengeListeners.forEach((cb) => cb(msg));
      }
    }
    notifyListeners() {
      const list = this.getUsersList();
      this.listeners.forEach((cb) => cb(list));
    }
    getUsersList() {
      return Array.from(this.users.values());
    }
  };

  // src/messagingclient.ts
  var MessagingClient = class {
    nchan;
    activeLobbies = [];
    activeTables = [];
    lastLobbyConfig;
    constructor(options) {
      this.nchan = new NchanClient(options.baseUrl);
    }
    /**
     * Initializes the client and ensures connection readiness.
     * In browser environments, attaches lifecycle event listeners.
     */
    async start() {
      if (typeof window !== "undefined") {
        window.addEventListener("pagehide", this.handlePageHide);
        window.addEventListener("pageshow", this.handlePageShow);
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
      }
    }
    /**
     * Stops all active connections and cleans up.
     */
    async stop() {
      if (typeof window !== "undefined") {
        window.removeEventListener("pagehide", this.handlePageHide);
        window.removeEventListener("pageshow", this.handlePageShow);
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      }
      await Promise.all(this.activeLobbies.map((lobby) => lobby.leave()));
      this.activeLobbies = [];
      this.activeTables.forEach((table) => table.leave());
      this.activeTables = [];
    }
    /**
     * Enters the global lobby for presence broadcasting and tracking.
     */
    async joinLobby(user, options) {
      this.lastLobbyConfig = { user, options };
      const lobby = new Lobby(this.nchan, user, options);
      await lobby.join();
      this.activeLobbies.push(lobby);
      return lobby;
    }
    /**
     * Joins a specific table for communication.
     */
    async joinTable(tableId, userId) {
      const table = new Table(this.nchan, tableId, userId);
      await table.join();
      this.activeTables.push(table);
      return table;
    }
    handlePageHide = () => {
      this.stop();
    };
    handlePageShow = (event) => {
      if (event.persisted && this.lastLobbyConfig) {
        this.joinLobby(this.lastLobbyConfig.user, this.lastLobbyConfig.options);
      }
    };
    handleVisibilityChange = () => {
      if (document.hidden) {
        this.activeLobbies.forEach((l) => l.pauseHeartbeat());
      } else {
        this.activeLobbies.forEach((l) => l.resumeHeartbeat());
      }
    };
  };
  return __toCommonJS(messagingclient_exports);
})();
