import { writable, type Updater, derived } from 'svelte/store';
import { type RankingInformation } from './websocket';
import { RankingCoordinator, type ExpandedAuthorInformation } from './rankingCoordinator';
import { DeconflictQueue } from './deconflictQueue';

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
  ['raid', 'Twitch'],
  ['emote', 'Twitch'],
  ['partner', 'Twitch'],
  ['non-vips', 'Twitch'],
  ['overall', 'Twitch'],
  ['subathon_2_discord_cookies', 'Archived'],
  ['subathon_2_bits', 'Archived'],
  ['subathon_2_emote', 'Archived'],
  ['subathon_2_overall', 'Archived'],
  ['subathon_2_twitch_livestream', 'Archived'],
  ['subathon_2_non - vips', 'Archived'],
  ['subathon_2_subs', 'Archived'],
  ['subathon_2_partner', 'Archived'],
  ['subathon_2_raid', 'Archived'],
  ['subathon_2_discord_livestream', 'Archived'],
  ['subathon_2_message_count', 'Archived'],
  ['subathon_2_non-vips', 'Archived'],
  ['discord_livestream', 'Discord'],
  ['discord_cookies', 'Discord']
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

export const rankingCoordinator = new RankingCoordinator();
export const deconflictQueue = new DeconflictQueue();

function subscribeWSUpdates(
  set: (value: Map<string, Leaderboard>) => void,
  update: (fn: Updater<Map<string, Leaderboard>>) => void
) {
  rankingCoordinator.setOnInitialInfo((data) => {
    const result = new Map<string, Leaderboard>();
    for (const name of data.leaderboard_names) {
      result.set(name, { name, data: new Map() });
    }
    set(result);
  });

  rankingCoordinator.setOnChangesMessage(async (changes) => {
    // extract the existing leaderboard data
    let cachedLeaderboard = new Map<string, Leaderboard>();
    const permit = deconflictQueue.enqueue();

    update((leaderboard) => {
      cachedLeaderboard = leaderboard;
      return leaderboard;
    });

    // permit for async conflict resolution i hope
    await Promise.all(
      Array.from(changes.changes.entries()).map(async ([id, value]) => {
        if (cachedLeaderboard.get(changes.leaderboard_name) === undefined) {
          cachedLeaderboard.set(changes.leaderboard_name, {
            name: changes.leaderboard_name,
            data: new Map()
          });
        }

        cachedLeaderboard.get(changes.leaderboard_name)!.data.set(id, {
          ...value,
          author: await rankingCoordinator.populateAuthor(value.author_id)
        });
      })
    );

    await deconflictQueue.dequeue(permit);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update((_) => {
      return cachedLeaderboard;
    });
  });
}
