<!--Leaderboard -->

<script lang="ts">
  import { onMount } from 'svelte';
  import RankItem from './rankitem.svelte';
  import { rankingCoordinator, type FullRankingInformation } from './ranks';
  import { flip } from 'svelte/animate';
  import { crutch_dedeuplicateByKeyFunction } from './support';

  export let currentData: Map<number, FullRankingInformation>;
  export let maxItemHeight: number = 10;
  export let leaderboardId: string;

  let pinnedUserRankItem: HTMLElement | null = null;

  $: platform = currentData.get(0)?.author.platform ?? 'unknown';

  const amount = 100;

  onMount(() => {
    rankingCoordinator.changeWindow(
      leaderboardId,
      0,
      amount - 1,
      pinnedUsername.length === 0 ? undefined : pinnedUsername,
      platform
    );
  });

  /* User Pinning Shenanigans */
  export let pinnedUsername = '';
  $: filteredList = crutch_dedeuplicateByKeyFunction(
    Array.from(currentData.entries())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .sort(([idxA, _], [idxB, __]) => idxA - idxB)
      .map(([idx, val]) => ({
        rank: idx + 1,
        val
      })),
    (item) => {
      return item.val.author.id;
    }
  );

  $: {
    if (pinnedUserRankItem !== null) {
      pinnedUserRankItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  }
</script>

<div class="relative w-full md:h-60 grow md:h-full overflow-y-scroll">
  <div class="w-full">
    {#key currentData.size}
      {#each filteredList as rank (rank.val.author.id)}
        <div bind:this={pinnedUserRankItem} animate:flip>
          {#if pinnedUsername === rank.val.author.username}
            <div bind:this={pinnedUserRankItem}>
              <RankItem
                rank={rank.rank}
                score={rank.val.elo}
                username={rank.val.author.username}
                delta={0}
                avatarUrl={rank.val.author.avatar}
                onHeightChanged={(height) => {
                  maxItemHeight = Math.max(height, maxItemHeight);
                }}
              />
            </div>
          {:else}
            <div>
              <RankItem
                rank={rank.rank}
                score={rank.val.elo}
                username={rank.val.author.username}
                delta={0}
                avatarUrl={rank.val.author.avatar}
                onHeightChanged={(height) => {
                  maxItemHeight = Math.max(height, maxItemHeight);
                }}
              />
            </div>
          {/if}
        </div>
      {/each}
    {/key}
  </div>
</div>
