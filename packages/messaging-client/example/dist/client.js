(() => {
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
      let reconnectTimer = null;
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
            reconnectTimer = setTimeout(connect, delay);
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
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }
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
    constructor(nchan, tableId, userId2, lobby2) {
      this.nchan = nchan;
      this.tableId = tableId;
      this.userId = userId2;
      this.lobby = lobby2;
      if (this.lobby) {
        const handler = (users) => this.handleLobbyUsersChange(users);
        this.lobby.onUsersChange(handler);
        this.lobbyUnsubscribe = () => {
          this.lobby?.offUsersChange(handler);
        };
      }
    }
    subscription = null;
    messageListeners = [];
    spectatorListeners = [];
    opponentLeftListeners = [];
    lobbyUnsubscribe;
    opponentLeft = false;
    opponentSeen = false;
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
     * Subscribe to opponent departure (explicit leave or timeout).
     */
    onOpponentLeft(callback) {
      this.opponentLeftListeners.push(callback);
      if (this.opponentLeft) {
        callback();
      }
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
    async leave() {
      try {
        await this.publish("SYSTEM_DISCONNECT", {});
        await new Promise((r) => setTimeout(r, 100));
      } catch (e) {
      }
      if (this.lobby) {
        await this.lobby.updatePresence({ tableId: void 0 });
      }
      this.subscription?.stop();
      this.messageListeners = [];
      this.spectatorListeners = [];
      this.opponentLeftListeners = [];
      this.lobbyUnsubscribe?.();
    }
    handleIncomingMessage(data) {
      const msg = parseMessage(data);
      if (!msg || !msg.type) return;
      if (msg.type === "SYSTEM_DISCONNECT" && msg.senderId !== this.userId) {
        this.notifyOpponentLeft();
      }
      this.messageListeners.forEach((cb) => cb(msg));
    }
    handleLobbyUsersChange(users) {
      const playersAtThisTable = users.filter((u) => u.tableId === this.tableId);
      const opponent = playersAtThisTable.find((u) => u.userId !== this.userId);
      if (opponent) {
        this.opponentSeen = true;
      }
      if (this.opponentSeen && !opponent) {
        this.notifyOpponentLeft();
      }
    }
    notifyOpponentLeft() {
      if (this.opponentLeft) return;
      this.opponentLeft = true;
      this.opponentLeftListeners.forEach((cb) => cb());
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
        for (const [userId2, user] of this.users.entries()) {
          if (userId2 === this.currentUser.userId) continue;
          const lastSeen = user.lastSeen || now;
          if (now - lastSeen > this.staleTtl) {
            this.users.delete(userId2);
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
     * Stop listening to user changes.
     */
    offUsersChange(callback) {
      this.listeners = this.listeners.filter((l) => l !== callback);
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
    async challenge(userId2, ruleType) {
      const tableId = getUID();
      await this.nchan.publishChallenge({
        type: "offer",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId2,
        ruleType,
        tableId
      });
      return tableId;
    }
    /**
     * Accept an incoming challenge.
     * Returns the Table instance for the accepted game.
     */
    async acceptChallenge(userId2, ruleType, tableId) {
      await this.nchan.publishChallenge({
        type: "accept",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId2,
        ruleType,
        tableId
      });
      await this.updatePresence({ tableId });
      const table = new Table(this.nchan, tableId, this.currentUser.userId, this);
      await table.join();
      return table;
    }
    /**
     * Decline an incoming challenge.
     */
    async declineChallenge(userId2, ruleType) {
      await this.nchan.publishChallenge({
        type: "decline",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId2,
        ruleType
      });
    }
    /**
     * Cancel an outgoing challenge.
     */
    async cancelChallenge(userId2, ruleType) {
      await this.nchan.publishChallenge({
        type: "cancel",
        challengerId: this.currentUser.userId,
        challengerName: this.currentUser.userName,
        recipientId: userId2,
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
        msg.lastSeen = Date.now();
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
      await Promise.all(this.activeLobbies.map((lobby2) => lobby2.leave()));
      this.activeLobbies = [];
      for (const table of this.activeTables) {
        await table.leave();
      }
      this.activeTables = [];
    }
    /**
     * Enters the global lobby for presence broadcasting and tracking.
     */
    async joinLobby(user, options) {
      this.lastLobbyConfig = { user, options };
      const lobby2 = new Lobby(this.nchan, user, options);
      await lobby2.join();
      this.activeLobbies.push(lobby2);
      return lobby2;
    }
    /**
     * Joins a specific table for communication.
     */
    async joinTable(tableId, userId2) {
      let table = this.activeTables.find((t) => t.tableId === tableId);
      if (!table) {
        const lobby2 = this.activeLobbies.find((l) => l.currentUser.userId === userId2);
        console.log(`MessagingClient [${userId2}] creating new Table ${tableId}`);
        table = new Table(this.nchan, tableId, userId2, lobby2);
        this.activeTables.push(table);
        if (lobby2) {
          await lobby2.updatePresence({ tableId });
        }
      } else {
        console.log(`MessagingClient [${userId2}] reusing existing Table ${tableId}`);
      }
      await table.join();
      await new Promise((r) => setTimeout(r, 100));
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

  // example/src/client.ts
  var params = new URLSearchParams(window.location.search);
  var userId = params.get("id") || "user-" + Math.random().toString(36).substr(2, 5);
  var userName = params.get("name") || "User";
  var client = new MessagingClient({
    baseUrl: window.location.hostname
  });
  var lobby = null;
  var currentTable = null;
  var activeChallenge = null;
  async function initLobby(lobbyInstance) {
    lobbyInstance.onUsersChange((users) => {
      const list = document.getElementById("user-list");
      const countEl = document.getElementById("count");
      if (countEl) countEl.innerText = `Online Users: ${users.length}`;
      if (list) {
        list.innerHTML = users.map((u) => {
          const isMe = u.userId === userId;
          const inGame = !!u.tableId;
          const isSeeking = !!u.seek;
          let actionBtn = "";
          if (!isMe && !inGame) {
            if (isSeeking) {
              actionBtn = `<button class="btn-join" onclick="joinSeek('${u.userId}', '${u.seek?.tableId}')">Join Game</button>`;
            } else {
              actionBtn = `<button class="btn-challenge" onclick="challengeUser('${u.userId}')">Challenge</button>`;
            }
          }
          return `
                    <li class="user-item ${isMe ? "me" : ""}">
                        <div>
                            <span>${u.userName}</span>
                            <div class="status">
                                ${u.userId} 
                                ${inGame ? "(In Game: " + u.tableId + ")" : ""}
                                ${isSeeking ? "(Seeking Game...)" : ""}
                            </div>
                        </div>
                        ${actionBtn}
                    </li>
                `;
        }).join("");
      }
    });
    lobbyInstance.onChallenge((challenge) => {
      if (challenge.type === "offer") {
        activeChallenge = challenge;
        showChallenge(challenge);
      } else if (challenge.type === "accept") {
        joinGame(challenge.tableId, challenge.challengerId);
      } else if (challenge.type === "decline" || challenge.type === "cancel") {
        if (activeChallenge?.challengerId === challenge.challengerId) {
          hideChallenge();
        }
        console.log(`Challenge ${challenge.type}ed by ${challenge.challengerName}`);
      }
    });
  }
  window.connect = async () => {
    try {
      await client.start();
      lobby = await client.joinLobby({
        messageType: "presence",
        type: "join",
        userId,
        userName
      });
      await initLobby(lobby);
      const myNameEl = document.getElementById("my-name");
      if (myNameEl) myNameEl.innerText = `Hello, ${userName} (${userId})`;
      updateConnectionUI(true);
    } catch (e) {
      console.error("Connection failed", e);
    }
  };
  window.disconnect = async () => {
    await client.stop();
    lobby = null;
    currentTable = null;
    updateConnectionUI(false);
    const list = document.getElementById("user-list");
    if (list) list.innerHTML = "";
    const myNameEl = document.getElementById("my-name");
    if (myNameEl) myNameEl.innerText = "Disconnected";
  };
  function updateConnectionUI(online) {
    const statusEl = document.getElementById("conn-status");
    const btnConnect = document.getElementById("btn-connect");
    const btnDisconnect = document.getElementById("btn-disconnect");
    const btnFindGame = document.getElementById("btn-find-game");
    if (statusEl) {
      statusEl.innerText = online ? "ONLINE" : "OFFLINE";
      statusEl.className = `connection-status ${online ? "online" : "offline"}`;
    }
    if (btnConnect) btnConnect.style.display = online ? "none" : "block";
    if (btnDisconnect) btnDisconnect.style.display = online ? "block" : "none";
    if (btnFindGame) btnFindGame.disabled = !online;
  }
  function showChallenge(challenge) {
    const container = document.getElementById("challenge-container");
    const text = document.getElementById("challenge-text");
    if (container && text) {
      text.innerText = `${challenge.challengerName} has challenged you to a game!`;
      container.style.display = "block";
    }
  }
  function hideChallenge() {
    const container = document.getElementById("challenge-container");
    if (container) container.style.display = "none";
    activeChallenge = null;
  }
  async function joinGame(tableId, opponentId) {
    if (currentTable) {
      await currentTable.leave();
    }
    currentTable = await client.joinTable(tableId, userId);
    if (lobby) {
      await lobby.updatePresence({ tableId, seek: void 0 });
    }
    const container = document.getElementById("game-container");
    const text = document.getElementById("game-text");
    if (container && text) {
      text.innerText = `Playing on table: ${tableId} against ${opponentId}`;
      container.style.display = "block";
    }
    currentTable.onMessage((msg) => {
      console.log("Game Message:", msg);
    });
  }
  window.findGame = async () => {
    if (!lobby) return;
    const tableId = getUID();
    await lobby.updatePresence({ seek: { tableId, ruleType: "standard" } });
    document.getElementById("seek-container").style.display = "block";
  };
  window.cancelSeek = async () => {
    if (!lobby) return;
    await lobby.updatePresence({ seek: void 0 });
    document.getElementById("seek-container").style.display = "none";
  };
  window.joinSeek = async (targetUserId, tableId) => {
    console.log("Joining seek from:", targetUserId, "at table:", tableId);
    await joinGame(tableId, targetUserId);
  };
  window.challengeUser = async (targetUserId) => {
    if (!lobby) return;
    console.log("Challenging user:", targetUserId);
    await lobby.challenge(targetUserId, "standard");
  };
  window.leaveGame = async () => {
    if (currentTable) {
      await currentTable.leave();
      currentTable = null;
      if (lobby) {
        await lobby.updatePresence({ tableId: void 0 });
      }
      const container = document.getElementById("game-container");
      if (container) container.style.display = "none";
    }
  };
  document.getElementById("btn-accept")?.addEventListener("click", async () => {
    if (activeChallenge && lobby) {
      const table = await lobby.acceptChallenge(
        activeChallenge.challengerId,
        activeChallenge.ruleType,
        activeChallenge.tableId
      );
      currentTable = table;
      hideChallenge();
      const container = document.getElementById("game-container");
      const text = document.getElementById("game-text");
      if (container && text) {
        text.innerText = `Playing on table: ${activeChallenge.tableId} against ${activeChallenge.challengerName}`;
        container.style.display = "block";
      }
    }
  });
  document.getElementById("btn-decline")?.addEventListener("click", async () => {
    if (activeChallenge && lobby) {
      await lobby.declineChallenge(activeChallenge.challengerId, activeChallenge.ruleType);
      hideChallenge();
    }
  });
  window.updateName = async () => {
    const input = document.getElementById("name-input");
    const newName = input?.value;
    if (newName && lobby) {
      await lobby.updatePresence({ userName: newName });
      const myNameEl = document.getElementById("my-name");
      if (myNameEl) myNameEl.innerText = `Hello, ${newName} (${userId})`;
    }
  };
  updateConnectionUI(false);
  window.connect();
})();
