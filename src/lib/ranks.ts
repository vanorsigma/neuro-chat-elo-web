import { writable, type Updater, derived } from 'svelte/store';
import { type RankingInformation } from './websocket';
import { RankingCoordinator, type ExpandedAuthorInformation } from './rankingCoordinator';

export interface FullRankingInformation {
  author: ExpandedAuthorInformation;
  elo: number;
}

export interface Leaderboard {
  name: string;
  data: Map<number, FullRankingInformation>;
}

export type LeaderboardWithCategory = Leaderboard & { category: string };

export interface WSLeaderboard {
  name: string;
  data: RankingInformation[];
}

export const liveRanks = writable(new Map<string, Leaderboard>(), subscribeWSUpdates);

export const categoryMapping = new Map([
  ['message_count', 'Twitch'],
  ['subs', 'Twitch'],
  ['bits', 'Twitch'],
  ['twitch_livestream', 'Twitch'],
  ['raid', 'Twitch']
]);

export const categoryLiveRanks = derived(liveRanks, ($liveRanks) => {
  const result = new Map<string, LeaderboardWithCategory>();
  for (const [key, value] of $liveRanks.entries()) {
    result.set(key, {
      ...value,
      category: categoryMapping.get(key) ?? 'Unknown'
    });
  }
  return result;
});

const rankingCoordinator = new RankingCoordinator();

function subscribeWSUpdates(
  set: (value: Map<string, Leaderboard>) => void,
  update: (fn: Updater<Map<string, Leaderboard>>) => void
) {
  // rankingCoordinator.setOnInitialMessage(async (data) => {
  //   const resultMap = new Map();
  //   for (const [key, value] of data.leaderboard.entries()) {
  //     resultMap.set(key, {
  //       name: key,
  //       data: await Promise.all(value.map(async info => ({
  //         ...info,
  //         author: await rankingCoordinator.populateAuthor(info.author_id),
  //       })))
  //     } as Leaderboard);
  //   }

  //   set(resultMap);
  // });

  rankingCoordinator.setOnChangesMessage(async (changes) => {
    const authorLookup = new Map();
    for (const value of changes.changes.values()) {
      authorLookup.set(value.author_id, await rankingCoordinator.populateAuthor(value.author_id));
    }

    update((leaderboard) => {
      for (const [id, value] of changes.changes.entries()) {
        if (leaderboard.get(changes.leaderboard_name) === undefined) {
          leaderboard.set(changes.leaderboard_name, { name: changes.leaderboard_name, data: new Map() });
        }

        leaderboard.get(changes.leaderboard_name)!.data.set(id, {
          ...value,
          author: authorLookup.get(value.author_id)
        });
      }
      return leaderboard;
    });
  });
}
