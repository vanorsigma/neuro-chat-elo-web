import { readable, writable, type Updater, derived } from 'svelte/store';
import axios from 'axios';
import { BadgeInformation, LeaderboardExport } from '../gen/leaderboardExportTypes';
import { EloWebSocket, type RankingInformation } from './websocket';
import { RankingCoordinator, type ExpandedAuthorInformation } from './rankingCoordinator';

export interface FullRankingInformation {
  author: ExpandedAuthorInformation,
  elo: number
}

export interface Leaderboard {
  name: string;
  data: FullRankingInformation[];
}

export type LeaderboardWithCategory = Leaderboard & { category: string };

export interface WSLeaderboard {
  name: string;
  data: RankingInformation[];
}

export const liveRanks = writable(
  new Map<string, Leaderboard>(),
  subscribeWSUpdates
);

export const categoryMapping = new Map([
  ['message_count', 'Twitch'],
  ['subs', 'Twitch'],
  ['bits', 'Twitch'],
  ['twitch_livestream', 'Twitch'],
  ['raid', 'Twitch'],
]);

export const categoryLiveRanks = derived(
  liveRanks,
  $liveRanks => {
    const result = new Map<string, LeaderboardWithCategory>();
    for (const [key, value] of $liveRanks.entries()) {
      result.set(key, {
        ...value,
        category: categoryMapping.get(key) ?? 'Unknown'
      });
    }
    return result;
  }
);

const rankingCoordinator = new RankingCoordinator();

function subscribeWSUpdates(
  set: (value: Map<string, Leaderboard>) => void,
  update: (fn: Updater<Map<string, Leaderboard>>) => void,
) {
  rankingCoordinator.setOnInitialMessage(data => {
    const resultMap = new Map();
    for (const [key, value] of data.leaderboard.entries()) {
      resultMap.set(key, {
        name: key,
        data: value.map(info => ({
          ...info,
          author: rankingCoordinator.populateAuthor(info.author_id),
        }))
      } as Leaderboard);
    }

    set(resultMap);
  });

  rankingCoordinator.setOnChangesMessage(changes => {
    update((leaderboard) => {
      changes.changes.forEach((deltas: Map<number, RankingInformation>, key: string) => {
        deltas.forEach((value: RankingInformation, id: number) => {
          if (id < leaderboard.get(key)!.data.length) {
            leaderboard.get(key)!.data[id] = {
              ...value,
              author: rankingCoordinator.populateAuthor(value.author_id),
            };
          }
        })
      });
      return leaderboard;
    });
  });
}
