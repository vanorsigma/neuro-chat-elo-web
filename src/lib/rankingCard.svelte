<script lang="ts">
  import Leaderboard from '$lib/leaderboard.svelte';
  import Podium from '$lib/podium.svelte';
  import type { FullRankingInformation } from '$lib/ranks';
  import type { User } from '$lib/user';
  import { onDestroy, onMount } from 'svelte';

  export let leaderboardId: string;
  export let rankingInfo: Map<number, FullRankingInformation>;
  export let pinTextValue: string;
  let innerPinTextValue: string = '';
  var windowWidth = window.innerWidth;
  $: rankingInfoLength = rankingInfo.size;
  $: platform = rankingInfo.get(0)?.author.platform ?? 'unknown';

  let topUsers: User[];

  $: {
    topUsers = Array.from(rankingInfo.values())
      .slice()
      .sort((a, b) => (a.elo > b.elo ? -1 : a.elo == b.elo ? 0 : 1))
      .slice(0, 3)
      .map((data) => ({
        name: data.author.username,
        elo: data.elo,
        avatar: data.author.avatar
      }));
  }

  function onPinButtonClicked() {
    if (innerPinTextValue === pinTextValue) {
      innerPinTextValue = '';
      pinTextValue = '';
    } else {
      pinTextValue = innerPinTextValue;
    }
  }

  function onWindowResize() {
    windowWidth = window.innerWidth;
  }

  onMount(() => {
    window.addEventListener('resize', onWindowResize);
    innerPinTextValue = pinTextValue;
  });

  onDestroy(() => {
    window.removeEventListener('resize', onWindowResize);
  });
</script>

<div class="flex flex-col md:flex-row justify-center items-center w-full h-full gap-3 min-h-0">
  <div class="bg-chat rounded-xl flex flex-col flex-none md:flex-0 items-center gap-2 p-5 h-min">
    <h1 class="text-3xl">Top Chatters</h1>
    {#if rankingInfoLength >= 3}
      <Podium
        size={windowWidth < 768 ? '100%' : '60vmin'}
        firstPlace={topUsers[0]}
        secondPlace={topUsers[1]}
        thirdPlace={topUsers[2]}
      />
    {/if}
  </div>

  <div
    class="bg-chat rounded-xl flex flex-col items-center max-h-[70vh] md:max-h-[90%] flex-0 p-5 w-full md:w-[40%] min-h-0"
  >
    <h1 class="text-3xl">Leaderboard</h1>
    {#if platform !== 'unknown'}
      <div class="flex flex-row">
        <input
          class="md:self-end m-2"
          type="text"
          placeholder="Pin username..."
          alt="Username"
          disabled={pinTextValue.length > 0}
          bind:value={innerPinTextValue}
        />
        <button on:click={onPinButtonClicked} class="bg-neuro px-3 rounded"
          >{pinTextValue.length > 0 ? 'Unpin' : 'Pin'}</button
        >
      </div>
      {#if pinTextValue.length > 0}
        <p class="text-xs">Pinned. If you'd like to scroll again, please clear the pin.</p>
      {/if}
    {/if}
    {#if rankingInfoLength >= 3}
      <Leaderboard {leaderboardId} pinnedUsername={pinTextValue} currentData={rankingInfo} />
    {/if}
  </div>
</div>
