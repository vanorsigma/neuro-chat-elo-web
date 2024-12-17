<script lang="ts">
  import Leaderboard from '$lib/leaderboard.svelte';
  import Podium from '$lib/podium.svelte';
  import type { FullRankingInformation } from '$lib/ranks';
  import type { User } from '$lib/user';
  import { onDestroy, onMount } from 'svelte';

  export let isActive: boolean;
  export let rankingInfo: Map<number, FullRankingInformation>;
  export let userSearchTextValue: string;
  var windowWidth = window.innerWidth;
  $: rankingInfoLength = rankingInfo.size;

  let topUsers: User[];

  $: {
    topUsers = Array.from(rankingInfo.values())
      .slice()
      .sort((a, b) => (a.elo > b.elo ? 1 : a.elo == b.elo ? 0 : -1))
      .slice(0, 3)
      .map((data) => ({
        name: data.author.username,
        elo: data.elo,
        avatar: data.author.avatar
      }));
  }

  let currentTimeout: number | undefined;
  function onSearchTextValueInput(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
    clearTimeout(currentTimeout);
    currentTimeout = setTimeout(() => {
      // NOTE: I know for a fact that value exists in the target
      userSearchTextValue = (e.target as unknown as { value: string })?.value;
    }, 200) as unknown as number;
  }

  function onWindowResize() {
    windowWidth = window.innerWidth;
  }

  onMount(() => {
    window.addEventListener('resize', onWindowResize);
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
    <input
      class="md:self-end m-2"
      type="text"
      placeholder="Search username..."
      alt="Username"
      on:input={(e) => onSearchTextValueInput(e)}
      value={userSearchTextValue}
    />
    {#if rankingInfoLength >= 3}
      <Leaderboard {isActive} searchTerm={userSearchTextValue} currentData={rankingInfo} />
    {/if}
  </div>
</div>
