<script lang="ts">
  import RankingCard from '$lib/rankingCard.svelte';
  import LoadableFlexContainer from '$lib/loadableFlexContainer.svelte';
  import RevealCards from '$lib/revealCards.svelte';
  import type { RevealMetadata } from '$lib/revealMetadata';
  import { liveRanks, rankingCoordinator, type Leaderboard } from '$lib/ranks';
  import { sanitizeString } from '$lib';
  import Menu from '$lib/menu.svelte';
  import Burger from '$lib/burger.svelte';
  import { onDestroy } from 'svelte';

  let showRankingsLoading = true; // TODO: we no longer have revealCards, but it would nice to keep the infra
  let allowRankings = false; // this forces the loading text to appear
  let activeIndex =
    sanitizeString(new URL(window.location.href).searchParams.get('index')) || 'twitch_livestream';

  $: {
    // NOTE: required initialization to have /some/ items to populate.
    rankingCoordinator.changeWindow(activeIndex, 0, 2);
  }

  let rankings = new Map<string, Leaderboard>();
  liveRanks.subscribe((value) => {
    rankings = value;
  });

  let menuAppear = false;

  function navigatePage(page: string) {
    activeIndex = page;
  }

  $: {
    const url = new URL(window.location.href);
    url.searchParams.set('index', activeIndex.toString());
    // HACK: I get an error when trying to use Svelte's replaceState,
    // so this'll do for now
    window.history.replaceState({}, '', url.toString());
  }

  let websocketOnline = rankingCoordinator.getIsOnline();
  let unsubscribeHandle = rankingCoordinator.getIsOnlineStore().subscribe((value) => {
    websocketOnline = value;
  });

  onDestroy(() => {
    unsubscribeHandle();
  });

  // Searching shenanigans
  const userPinTextKey = 'pin';
  let userPinValue: string = new URL(window.location.href).searchParams.get(userPinTextKey) || '';

  $: {
    const url = new URL(window.location.href);
    if (userPinValue === undefined || userPinValue === '') {
      url.searchParams.set(userPinTextKey, '');
    } else {
      url.searchParams.set(userPinTextKey, sanitizeString(userPinValue));
    }
    window.history.replaceState({}, '', url.toString());
  }

  // Reveal Shenanigans
  async function onAnimationDone() {
    showRankingsLoading = true;

    // Give some time for the loading to show up
    setTimeout(() => {
      allowRankings = true;
    }, 100);
  }

  $: metadatas = Array.from(
    Array.from(rankings.entries())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, leaderboardInfo]) => {
        return leaderboardInfo.data.size !== 0;
      })
      .map(([title, leaderboardInfo]) => {
        return {
          avatarName: leaderboardInfo.data.get(0)?.author.id,
          avatarUrl: leaderboardInfo.data.get(0)?.author.avatar,
          leaderboardName: title
        } as RevealMetadata;
      })
  );
</script>

<svg width="0" height="0">
  <defs>
    <linearGradient x1="0%" y1="0%" x2="100%" y2="0%" id="mx-gradient-ffd700-1-ffb570-1-e-0">
      <stop offset="0%" style="stop-color: rgb(255, 215, 0); stop-opacity: 1;" />
      <stop offset="100%" style="stop-color: rgb(255, 181, 112); stop-opacity: 1;" />
    </linearGradient>

    <linearGradient x1="0%" y1="0%" x2="100%" y2="0%" id="mx-gradient-4d4d4d-1-c0c0c0-1-e-0">
      <stop offset="0%" style="stop-color: rgb(77, 77, 77); stop-opacity: 1;" />
      <stop offset="100%" style="stop-color: rgb(192, 192, 192); stop-opacity: 1;" />
    </linearGradient>

    <linearGradient x1="0%" y1="0%" x2="100%" y2="0%" id="mx-gradient-613e00-1-ffb570-1-e-0">
      <stop offset="0%" style="stop-color: rgb(97, 62, 0); stop-opacity: 1;" />
      <stop offset="100%" style="stop-color: rgb(255, 181, 112); stop-opacity: 1;" />
    </linearGradient>

    <linearGradient x1="0%" y1="0%" x2="0%" y2="100%" id="mx-gradient-ffd700-1-d4c11e-1-s-0">
      <stop offset="0%" style="stop-color: rgb(255, 215, 0); stop-opacity: 1;" />
      <stop offset="100%" style="stop-color: rgb(212, 193, 30); stop-opacity: 1;" />
    </linearGradient>
  </defs>
</svg>

{#if (rankings.get(activeIndex)?.data.size ?? 0) < 3}
  <div class="w-full h-screen flex flex-col items-center justify-center gap-2">
    <div class="w-fit h-fit text-center">
      <img
        class="flex-basis"
        alt="neuroSpin"
        src="https://cdn.7tv.app/emote/01HAZ1Y5JR000EY75ATHMFB7XQ/4x.avif"
      />
    </div>
    <p>Now Spinning...</p>
    <p>If this continues to happens, there might not be enough data.</p>
    <p>
      WebSocket Status: <span
        class:text-green-700={websocketOnline}
        class:text-red-700={!websocketOnline}
        >{websocketOnline ? 'Online' : 'Offline (refresh & try again)'}</span
      >
    </p>
  </div>
{/if}

<Burger
  onClick={() => {
    menuAppear = !menuAppear;
  }}
/>

{#if menuAppear}
  <Menu
    itemClicked={(page) => {
      navigatePage(page);
      menuAppear = !menuAppear;
    }}
    selectedPage={activeIndex}
  />
{/if}

{#if (rankings.get(activeIndex)?.data.size ?? 0) >= 3}
  <LoadableFlexContainer
    onload={() => {
      showRankingsLoading = false;
    }}
  >
    {#if rankings.has(activeIndex)}
      <div class="flex flex-col px-5 w-full h-full md:h-full md:h-[90%]">
        <h1 class="text-3xl flex-none font-bold my-5 md:my-0 text-center">
          {rankings.get(activeIndex)?.name}
        </h1>
        <RankingCard
          leaderboardId={rankings.get(activeIndex)?.name ?? ''}
          bind:pinTextValue={userPinValue}
          rankingInfo={rankings.get(activeIndex)?.data ?? new Map()}
        />
        <p>
          WebSocket: <span
            class:text-green-700={websocketOnline}
            class:text-red-700={!websocketOnline}>{websocketOnline ? 'Online' : 'Offline'}</span
          >
        </p>
      </div>
    {/if}
  </LoadableFlexContainer>
{/if}

{#if !showRankingsLoading && !allowRankings && Object.values(rankings)[Object.values(rankings).length - 1]?.info.ranks.length > 0}
  <RevealCards revealMetadatas={metadatas} allAnimationsDone={onAnimationDone} />
{/if}
