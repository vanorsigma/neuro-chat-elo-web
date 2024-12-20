<!--Leaderboard. TODO: At the moment, this lazy list can only increase the size of the window. In an ideal implementation, we literally only keep the window we want to see. However, this introduces problems with scrolling and I cannot be arsed to create a custom component to handle that (because mobile will require gestures, and desktop will require scroll position shenanigans), and removing a chunk and then adding a chunk on the other side definitely affects scrol positions. -->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import RankItem from './rankitem.svelte';
  import { rankingCoordinator, type FullRankingInformation } from './ranks';
  import { flip } from 'svelte/animate';

  export let currentData: Map<number, FullRankingInformation>;
  export let maxItemHeight: number = 10;
  export let containerElement: HTMLDivElement;
  export let tailElement: HTMLDivElement;
  export let leaderboardId: string;

  const minimumAmount = 5;
  let subscriptionHandle: () => void;
  let changesAwaiting = false;

  onDestroy(() => {
    subscriptionHandle();
  });

  onMount(() => {
    subscriptionHandle = rankingCoordinator.onChangeManualAwaiting.subscribe(
      (value) => (changesAwaiting = value)
    );
  });

  $: maxFitAmount = Math.ceil(containerElement?.clientHeight / maxItemHeight);
  $: thresholdAmount = Math.floor(maxFitAmount / 2) ?? 2;
  $: {
    if (maxFitAmount) {
      onTailObserved();
    }
  }

  /* Lazy Loading Shenanigans */
  function onRankItemVisible(rank: number, visibility: boolean) {
    const lengthLoaded = currentData.size;

    if (!visibility) return;
    if (rank < lengthLoaded - thresholdAmount) {
      return;
    }
    if (rankingCoordinator.rawStateOnChangeManualAwaiting) {
      return;
    }

    rankingCoordinator.changeWindow(
      leaderboardId,
      0,
      Math.max(minimumAmount, lengthLoaded + maxFitAmount)
    );
  }

  function onTailObserved() {
    const lengthLoaded = currentData.size;
    rankingCoordinator.changeWindow(
      leaderboardId,
      0,
      Math.max(minimumAmount, lengthLoaded + maxFitAmount)
    );
  }

  const tailObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      onTailObserved();
    }
  });

  onMount(() => {
    if (tailElement) {
      tailObserver.observe(tailElement);
    }

    const onMountFitAmt = Math.ceil(containerElement?.clientHeight / maxItemHeight);
    rankingCoordinator.changeWindow('emote', 0, Math.max(minimumAmount, onMountFitAmt), true);
  });

  /* Searchable Shenanigans */
  export let searchTerm = '';
  $: filteredList = Array.from(currentData.entries())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .sort(([idxA, _], [idxB, __]) => idxA - idxB)
    .map(([idx, val]) => ({
      rank: idx + 1,
      val
    }));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  /*.filter(({ val }) => {
      // every time this has to run, we reset the slice end
      return new RegExp(searchTerm, 'i').test(val.author.username);
    });*/
</script>

<div bind:this={containerElement} class="relative w-full md:h-60 grow md:h-full overflow-y-scroll">
  <div class="w-full">
    {#each filteredList as rank (rank.val.author.username)}
      <div animate:flip>
        <RankItem
          rank={rank.rank}
          score={rank.val.elo}
          username={rank.val.author.username}
          delta={0}
          avatarUrl={rank.val.author.avatar}
          onVisibilityChanged={(visible) => onRankItemVisible(rank.rank, visible)}
          onHeightChanged={(height) => {
            maxItemHeight = Math.max(height, maxItemHeight);
          }}
        />
      </div>
    {/each}
    <div bind:this={tailElement} class="h-[10px] text-center">
      {changesAwaiting ? 'Loading' : 'End of List'}
    </div>
  </div>
</div>
