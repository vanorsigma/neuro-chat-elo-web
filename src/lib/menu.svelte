<script lang="ts">
  import MenuItem from './menuitem.svelte';
  import { fly } from 'svelte/transition';
  import { ranksMap, type LeaderboardInfoWithCategory } from './ranks';
  import type { Readable } from 'svelte/store';
  import { onDestroy } from 'svelte';

  export let itemClicked: (arg0: string) => void;
  export let selectedPage: string;

  let rankings: { [key: string]: LeaderboardInfoWithCategory } = {};

  function callbackForStore(key: string, value: LeaderboardInfoWithCategory) {
    rankings[key] = value;
  }

  function subscribeStore(
    store: Readable<LeaderboardInfoWithCategory>,
    callback: (value: LeaderboardInfoWithCategory) => void
  ) {
    let unsubscribe = store.subscribe(callback);
    onDestroy(() => {
      unsubscribe();
    });
  }

  $: {
    for (let [key, value] of ranksMap.entries()) {
      subscribeStore(value, (v) => callbackForStore(key, v));
    }
  }

  $: categoryToLeaderboards = Object.entries(rankings).reduce(
    (
      acc: Map<string, { name: string; infoWithCategory: LeaderboardInfoWithCategory }[]>,
      [key, value]
    ) => {
      acc.set(value.category, [
        ...(acc.get(value.category) ?? []),
        {
          name: key,
          infoWithCategory: value
        }
      ]);
      return acc;
    },
    new Map()
  );

  function onMenuItemClick(page: string) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('index', `${page}`);
    window.history.pushState(
      {},
      '',
      window.location.origin + window.location.pathname + '?' + searchParams.toString()
    );
    itemClicked(page);
  }
</script>

<div
  transition:fly={{ x: -100 }}
  class="text-center absolute top-0 left-0 py-10 h-full w-6/12 md:w-72 bg-chat z-40 overflow-y-scroll"
>
  <p class="text-4xl">Menu</p>
  <br />

  {#each categoryToLeaderboards.entries() as [category, leaderboardsWithNames]}
    <p class="text-xl">{category}</p>
    {#each leaderboardsWithNames as menuItem}
      <MenuItem
        text={menuItem.name}
        onClick={() => onMenuItemClick(menuItem.infoWithCategory.id)}
        selected={selectedPage == menuItem.infoWithCategory.id}
      />
    {/each}
    <br />
  {/each}

  <p class="flex-none text-center hidden sm:block">
    Public Alpha. Please ping @vanorsigma for feedback
  </p>
</div>
