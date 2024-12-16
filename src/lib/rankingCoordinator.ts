import { EloWebSocket } from './websocket';
import axios from 'axios';
import { PUBLIC_PROFILE_URL } from '$env/static/public'
import { TimeCache } from './timecache';
import type { ChangeData, InitialData, RankingAuthorId } from './websocket';

export interface ExpandedAuthorInformation {
  platform: string;
  id: string;
  username: string;
  avatar: string;
  // TODO: badges
}

interface ProfileAPIResponse {
  username: string;
  avatar_url: string;
}

export class RankingCoordinator {
  private ws: EloWebSocket;
  private cache: TimeCache<string, ExpandedAuthorInformation>;

  constructor() {
    this.ws = new EloWebSocket();
    this.cache = new TimeCache(100, 1000 * 60 * 60);
  }

  setOnInitialMessage(callback: (data: InitialData) => void) {
    this.ws.setOnInitialMessage(callback);
  }

  setOnChangesMessage(callback: (data: ChangeData) => void) {
    this.ws.setOnChangesMessage(callback);
  }

  async populateAuthor(authorId: RankingAuthorId): Promise<ExpandedAuthorInformation> {
    if (this.cache.get(authorId.id)) {
      return this.cache.get(authorId.id)!;
    }

    try {
      const response = await axios(`${PUBLIC_PROFILE_URL}/${authorId.platform}/${authorId.id}`);
      const data = response.data as ProfileAPIResponse;
      const returnValue = {
        platform: authorId.platform,
        id: authorId.id,
        username: data.username,
        avatar: data.avatar_url,
      };

      this.cache.set(authorId.id, returnValue);
      return returnValue;
    }
    catch (error) {
      console.error('Error fetching profile:', authorId);
      return {
        platform: authorId.platform,
        id: authorId.id,
        username: '',
        avatar: '',
      }
    }
  }
}
