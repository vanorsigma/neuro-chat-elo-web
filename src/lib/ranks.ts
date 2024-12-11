import { readable } from 'svelte/store';
import axios from 'axios';
import { BadgeInformation, LeaderboardExport } from '../gen/leaderboardExportTypes';

export interface Badge {
  description: string;
  image_url: string;
}

export interface RankingInfo {
  id: string;
  rank: number;
  elo: number;
  username: string;
  delta: number;
  avatar: string;
  badges: Badge[];
}

export interface LeaderboardInfo {
  ranks: RankingInfo[];
  generatedAt: Date;
}

export interface LeaderboardInfoWithCategory {
  id: string;
  info: LeaderboardInfo;
  category: string;
}

const DEFAULT_LEADERBOARD_INFO: LeaderboardInfoWithCategory = {
  id: 'default',
  info: {
    ranks: [],
    generatedAt: new Date(0)
  },
  category: ''
};

function makeRankingInfo(identifier: string, category: string, path: string) {
  return (set: (arg0: LeaderboardInfoWithCategory) => void) => {
    axios.get(`./${path}`, { responseType: 'arraybuffer' }).then((result) => {
      if (result.status !== 200) {
        console.error(`Cannot fetch leaderboard from ${path}`);
        return;
      }
      try {
        const data = new Uint8Array(result.data);
        const leaderboard = LeaderboardExport.decode(data);
        const rankingInfo = mapLeaderboardToRanking(identifier, category, leaderboard);
        set(rankingInfo);
      } catch (error) {
        handleError(path, error as Error);
      }
    });
    return () => {};
  };
}

function mapLeaderboardToRanking(
  identifier: string,
  category: string,
  leaderboard: LeaderboardExport
): LeaderboardInfoWithCategory {
  const rankingInfo: RankingInfo[] = leaderboard.items.map((item) => {
    const badges = convertProtoBadges(item.badges);
    return {
      id: item.id,
      rank: item.rank,
      elo: item.elo,
      username: item.username,
      delta: item.delta,
      avatar: item.avatar,
      badges: badges
    };
  });
  return {
    id: identifier,
    info: {
      ranks: rankingInfo,
      generatedAt: new Date(leaderboard.generatedAt * 1000)
    },
    category
  };
}

function convertProtoBadges(badges: BadgeInformation[]): Badge[] {
  return badges.map((badge) => ({
    description: badge.description,
    image_url: badge.imageUrl
  }));
}

function handleError(path: string, error: Error) {
  // TODO: Create an error handling page for this.
  alert(`Error parsing leaderboard from ${path}: ${error}`);
}

const overallRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('overall', 'Twitch', 'overall.bin')
);
const chatOnlyRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('chat-only', 'Twitch', 'chat-only.bin')
);
const nonvipsRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('non-vips', 'Twitch', 'nonvips.bin')
);
const bitsRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('bits', 'Twitch', 'bits-only.bin')
);
const subsRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('subs', 'Twitch', 'subs-only.bin')
);
const discordRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('livestream-chat', 'Discord', 'discordlivestream.bin')
);
const partnersRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('partner-only', 'Twitch', 'partners-only.bin')
);
const bilibiliRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('bilibili', 'Bilibili', 'bilibililivestreamchat.bin')
);
const adventureTheFarmRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('adventures-farm', 'Community', 'adventures_farm.bin')
);
const emoteRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('top-emote', 'Twitch', 'top-emote.bin')
);
const ironmousePixelRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('ironmouse-pxls', 'Special Events', 'ironmouse_pxls.bin')
);
const pxlsRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('casual-pxls', 'Discord', 'casual_pxls.bin')
);
const ironmouseChatRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('ironmouse-pxls-chat', 'Special Events', 'ironmousecanvaschat.bin')
);
const cookiesRank = readable(
  DEFAULT_LEADERBOARD_INFO,
  makeRankingInfo('cookies', 'Discord', 'cookies.bin')
);

export const ranksMap = new Map([
  ['Overall', overallRank],
  ['Chat Only', chatOnlyRank],
  ['Non-VIPs', nonvipsRank],
  ['Bits Only', bitsRank],
  ['Subs Only', subsRank],
  ['Discord Livestream', discordRank],
  ['Partners Only', partnersRank],
  ['Bilibili Livestream Chat', bilibiliRank],
  ['Adventures Farm', adventureTheFarmRank],
  ['Top Emote', emoteRank],
  ['Ironmouse Pxls', ironmousePixelRank],
  ['Casual Pxls', pxlsRank],
  ['Ironmouse Canvas Chat', ironmouseChatRank],
  ['Cookies', cookiesRank]
]);
