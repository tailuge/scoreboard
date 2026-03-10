import type { PresenceMessage, ChallengeMessage, TableMessage } from "./types";

export type Subscription = { stop: () => void };

export class NchanClient {
  private server: string;

  constructor(server: string) {
    // Ensure server string doesn't end with a slash and starts with protocol if missing
    this.server = server.replace(/\/$/, "");
    if (!this.server.startsWith("http")) {
      this.server = `http://${this.server}`;
    }
  }

  private getWsUrl(path: string): string {
    return this.server.replace(/^http/, "ws") + path;
  }

  private getHttpUrl(path: string): string {
    return this.server + path;
  }

  private async publish(path: string, message: unknown): Promise<Response> {
    const url = this.getHttpUrl(path);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      throw new Error(`Publish failed: ${response.status}`);
    }
    return response;
  }

  // Publishing

  async publishPresence(message: Omit<PresenceMessage, "messageType">): Promise<Response> {
    return this.publish("/publish/presence/lobby", {
      ...message,
      messageType: "presence",
    });
  }

  async publishChallenge(message: Omit<ChallengeMessage, "messageType">): Promise<Response> {
    return this.publish("/publish/presence/lobby", {
      ...message,
      messageType: "challenge",
    });
  }

  async publishTable<T>(
    tableId: string,
    message: Omit<TableMessage<T>, "senderId">,
    senderId: string,
  ): Promise<Response> {
    return this.publish(`/publish/table/${tableId}`, {
      ...message,
      senderId,
    });
  }

  // Subscribing

  subscribePresence(onMessage: (data: string) => void): Subscription {
    return this.subscribe("/subscribe/presence/lobby", onMessage);
  }

  subscribeTable(tableId: string, onMessage: (data: string) => void): Subscription {
    return this.subscribe(`/subscribe/table/${tableId}`, onMessage);
  }

  private subscribe(path: string, onMessage: (data: string) => void): Subscription {
    const url = this.getWsUrl(path);
    let ws: WebSocket | null = null;
    let stopped = false;
    let reconnectAttempts = 0;
    const maxReconnectDelay = 30000;
    let reconnectTimer: any = null;

    const connect = () => {
      if (stopped) return;

      ws = new globalThis.WebSocket(url);

      ws.onmessage = (event) => {
        onMessage(event.data as string);
      };

      ws.onopen = () => {
        reconnectAttempts = 0;
      };

      ws.onclose = () => {
        if (!stopped) {
          const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, maxReconnectDelay);
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
      },
    };
  }
}
