import { PUBLIC_WS_HOST_URL } from '$env/static/public';

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
  return new Map(Object.entries(message).map(([key, value]) => [parseInt(key), value as RankingInformation]));
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
  private onChangesMessage: (data: WebsocketChangesMessage) => void = () => {};

  constructor() {
    this.ws = new WebSocket(PUBLIC_WS_HOST_URL);

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(await event.data.text()) as WebSocketIncoming;
      this.onMessage(message);
    };
  }

  setOnChangesMessage(callback: (data: WebsocketChangesMessage) => void) {
    this.onChangesMessage = callback;
  }

  onInitialInfo(data: WebsocketInitializeIncoming) {
    this.leaderboardNames = data.leaderboard_names;
    for (const leaderboardName of this.leaderboardNames) {
      this.ws.send(
        new Blob([
          JSON.stringify({
            type: 'change_window',
            window: {
              leaderboard_name: leaderboardName,
              starting_index: 2,
              following_entries: 10
            }
          } as WebsocketInitializeOutgoing)
        ])
      );
    }
  }

  private onMessage(message: WebSocketIncoming) {
    switch (message.type) {
      case 'changes':
        this.onChangesMessage(
          {
            ...message,
            changes: makeChangeData(message.changes as unknown as { [key: string]: object })
          }
        );
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
