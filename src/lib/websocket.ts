import { PUBLIC_WS_HOST_URL } from '$env/static/public';
import { writable, type Writable } from 'svelte/store';

export interface RankingAuthorId {
  platform: string;
  id: string;
}

export interface RankingInformation {
  author_id: RankingAuthorId;
  elo: number;
}

function makeChangeData(message: { [key: string]: object }): Map<number, RankingInformation> {
  // assumption: message is a valid ChangeData object
  return new Map(
    Object.entries(message).map(([key, value]) => [parseInt(key), value as RankingInformation])
  );
}

export interface WebsocketChangesMessage {
  readonly type: 'changes';
  leaderboard_name: string;
  changes: Map<number, RankingInformation>;
}

export interface WebsocketInitializeIncoming {
  readonly type: 'inital_info';
  leaderboard_names: string[];
}

export interface WebsocketInitializeWindow {
  leaderboard_name: string;
  starting_index: number;
  following_entries: number;
}

export interface WebsocketInitializeOutgoing {
  readonly type: 'change_window';
  window: WebsocketInitializeWindow;
}

export type WebSocketIncoming = WebsocketInitializeIncoming | WebsocketChangesMessage;
export type WebSocketOutgoing = WebsocketInitializeOutgoing;

export class EloWebSocket {
  private ws: WebSocket;
  private leaderboardNames: string[] = [];
  private onInitialInfoCallback: (data: WebsocketInitializeIncoming) => void = () => {};
  private onChangesMessage: (data: WebsocketChangesMessage) => void = () => {};
  private isOnline: Writable<boolean>;
  private beforeConnectBacklog: WebSocketOutgoing[] = [];

  constructor() {
    this.ws = new WebSocket(PUBLIC_WS_HOST_URL);
    this.isOnline = writable(false);

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(await event.data.text()) as WebSocketIncoming;
      this.onMessage(message);
    };

    this.ws.onopen = () => {
      this.isOnline.set(true);
      this.handleBacklog();
    }

    this.ws.onclose = () => {
      this.isOnline.set(false);
    }
  }

  private handleBacklog() {
    for (const message of this.beforeConnectBacklog) {
      this.ws.send(
        new Blob([
          JSON.stringify(message)
        ])
      );
    }
  }

  private trySend(message: WebSocketOutgoing) {
    if (this.ws.readyState !== WebSocket.OPEN) {
      this.beforeConnectBacklog.push(message);
      return;
    }

    this.ws.send(
      new Blob([
        JSON.stringify(message)
      ])
    );
  }

  getIsOnline() {
    return this.ws.readyState <= WebSocket.OPEN;
  }

  getIsOnlineStore() {
    return this.isOnline;
  }

  setOnInitializeInfo(callback: (data: WebsocketInitializeIncoming) => void) {
    this.onInitialInfoCallback = callback;
  }

  setOnChangesMessage(callback: (data: WebsocketChangesMessage) => void) {
    this.onChangesMessage = callback;
  }

  changeWindow(leaderboardName: string, startingIndex: number, followingEntries: number) {
    this.trySend({
      type: 'change_window',
      window: {
        leaderboard_name: leaderboardName,
        starting_index: startingIndex,
        following_entries: followingEntries
      }
    } as WebsocketInitializeOutgoing)
  }

  onInitialInfo(data: WebsocketInitializeIncoming) {
    this.leaderboardNames = data.leaderboard_names;
    this.onInitialInfoCallback(data);
  }

  private onMessage(message: WebSocketIncoming) {
    switch (message.type) {
      case 'changes':
        this.onChangesMessage({
          ...message,
          changes: makeChangeData(message.changes as unknown as { [key: string]: object })
        });
        break;
      case 'inital_info':
        this.onInitialInfo(message);
        break;
    }
  }

  close() {
    this.ws.close();
  }
}
