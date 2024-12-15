import { EloWebSocket } from './websocket';
import type { ChangeData, InitialData, RankingAuthorId } from './websocket';

export interface ExpandedAuthorInformation {
  platform: string;
  id: string;
  username: string;
  avatar: string;
  // TODO: badges
}

export class RankingCoordinator {
  private ws: EloWebSocket;

  constructor() {
    this.ws = new EloWebSocket();
  }

  setOnInitialMessage(callback: (data: InitialData) => void) {
    this.ws.setOnInitialMessage(callback);
  }

  setOnChangesMessage(callback: (data: ChangeData) => void) {
    this.ws.setOnChangesMessage(callback);
  }

  populateAuthor(authorId: RankingAuthorId): ExpandedAuthorInformation {
    // TODO: call the profile service from here
    return {
      platform: authorId.platform,
      id: authorId.id,
      username: authorId.id,
      avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/90e5b4cf-72ce-42f4-9685-a5794bfec28d-profile_image-300x300.png',
    };
  }
}
