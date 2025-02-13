import { EloWebSocket } from './websocket';
import axios from 'axios';
import { PUBLIC_PROFILE_URL } from '$env/static/public';
import { TimeCache } from './timecache';
import type {
  WebsocketChangesMessage,
  RankingAuthorId,
  WebsocketInitializeIncoming,
  Platform
} from './websocket';
import { writable, type Writable } from 'svelte/store';

export interface ExpandedAuthorInformation {
  platform: Platform;
  id: string;
  username: string;
  avatar: string;
  // TODO: badges
}

interface ProfileAPIResponse {
  id: string;
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

  async usernameToId(
    username: string,
    category: Platform
  ): Promise<string | undefined> {
    try {
      const response = await axios(`${PUBLIC_PROFILE_URL}/reverse/${category}/${username}`);
      const data = response.data as ProfileAPIResponse;
      return data.id;
    } catch (error) {
      console.error('Error fetching profile for username:', username);
      return undefined;
    }
  }

  async changeWindow(
    leaderboardName: string,
    startingIndex: number,
    followingEntries: number,
    followingUsername: string | undefined = undefined,
    category: Platform = 'unknown'
  ) {
    // if (!isInit) {
    //   this.rawStateOnChangeManualAwaiting = true;
    //   this.onChangeManualAwaiting.set(true);
    // }

    this.ws.changeWindow(
      leaderboardName,
      startingIndex,
      category,
      followingEntries,
      followingUsername
        ? await this.usernameToId(followingUsername, category)
        : undefined
    );
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
