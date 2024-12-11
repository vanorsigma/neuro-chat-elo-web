import { PUBLIC_WS_HOST_URL } from '$env/static/public'

interface RankingAuthorId {
  platform: string;
  id: string;
}

interface RankingInformation {
  author_id: RankingAuthorId;
  elo: number;
}

interface InitialData {
  leaderboard: Map<string, RankingInformation[]>;
}

interface ChangeData {
  changes: Map<string, Map<string, RankingInformation>>
}

function makeInitialData(message: { leaderboards: object }): InitialData {
  // assumption: message is a valid InitialData object
  return {
    leaderboard: new Map(Object.entries(message['leaderboards']))
  };
}

function makeChangeData(message: { changes: object }): ChangeData {
  // assumption: message is a valid ChangeData object
  return {
    changes: Object.entries(message['changes']).reduce((acc, [key, value]) => {
      acc.set(key, new Map(Object.entries(value)));
      return acc;
    }, new Map())
  };
}

export interface WebSocketInitialMessage {
  type: 'initial_leaderboards';
  data: InitialData;
};

export interface WebSocketChangesMessage {
  type: 'changes';
  data: ChangeData;
};

export type WebSocketMessage = WebSocketInitialMessage | WebSocketChangesMessage;

export class EloWebSocket {
  private ws: WebSocket;
  private onInitialMessage: (data: InitialData) => void = () => {};
  private onChangesMessage: (data: ChangeData) => void = () => {};

  constructor() {
    this.ws = new WebSocket(PUBLIC_WS_HOST_URL);

    this.ws.onmessage = async (event) => {
      const message = JSON.parse(await event.data.text()) as WebSocketMessage;
      this.onMessage(message);
    };
  }

  setOnInitialMessage(callback: (data: InitialData) => void) {
    this.onInitialMessage = callback;
  }

  setOnChangesMessage(callback: (data: ChangeData) => void) {
    this.onChangesMessage = callback;
  }

  private onMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'initial_leaderboards':
        this.onInitialMessage(makeInitialData(message.data as unknown as { leaderboards: object }));
        break;
      case 'changes':
        this.onChangesMessage(makeChangeData(message.data as { changes: object }));
        break;
    }
  }

  close() {
    this.ws.close();
  }
}
