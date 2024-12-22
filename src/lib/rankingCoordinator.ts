import { EloWebSocket } from './websocket';
import axios from 'axios';
import { PUBLIC_PROFILE_URL } from '$env/static/public';
import { TimeCache } from './timecache';
import type { WebsocketChangesMessage, RankingAuthorId, WebsocketInitializeIncoming } from './websocket';
import { writable, type Writable } from 'svelte/store';

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
  public rawStateOnChangeManualAwaiting: boolean;
  public onChangeManualAwaiting: Writable<boolean>;

  constructor() {
    this.ws = new EloWebSocket();
    this.cache = new TimeCache(20000, 1000 * 60 * 60);
    this.rawStateOnChangeManualAwaiting = false;
    this.onChangeManualAwaiting = writable(false);
  }

  setOnInitialInfo(callback: (data: WebsocketInitializeIncoming) => void) {
    this.ws.setOnInitializeInfo(callback);
  }

  setOnChangesMessage(callback: (data: WebsocketChangesMessage) => void) {
    this.ws.setOnChangesMessage((data) => {
      this.rawStateOnChangeManualAwaiting = false;
      this.onChangeManualAwaiting.set(false);
      callback(data);
    });
  }

  getIsOnlineStore() {
    return this.ws.getIsOnlineStore();
  }

  getIsOnline() {
    return this.ws.getIsOnline();
  }

  changeWindow(leaderboardName: string, startingIndex: number, followingEntries: number, isInit: boolean = false) {
    if (!isInit) {
      this.rawStateOnChangeManualAwaiting = true;
      this.onChangeManualAwaiting.set(true);
    }
    this.ws.changeWindow(leaderboardName, startingIndex, followingEntries);
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
        avatar: data.avatar_url
      };

      this.cache.set(authorId.id, returnValue);
      return returnValue;
    } catch (error) {
      console.error('Error fetching profile:', authorId);
      return {
        platform: authorId.platform,
        id: authorId.id,
        username: '',
        avatar: ''
      };
    }
  }
}
