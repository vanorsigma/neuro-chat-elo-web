<script lang="ts">
  import MenuItem from './menuitem.svelte';
  import { fly } from 'svelte/transition';
  import { categoryLiveRanks, type LeaderboardWithCategory } from './ranks';
  import { derived } from 'svelte/store';

  export let itemClicked: (arg0: string) => void;
  export let selectedPage: string;

  const derivedRankings = derived(categoryLiveRanks, ($categoryLiveRanks) => {
    return $categoryLiveRanks
      .entries()
      .reduce(
        (
          acc: Map<string, { name: string; infoWithCategory: LeaderboardWithCategory }[]>,
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
        new Map<string, { name: string; infoWithCategory: LeaderboardWithCategory }[]>()
      );
  });

  let rankings = $derivedRankings;

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

  {#each rankings.entries() as [category, leaderboardsWithNames]}
    <p class="text-xl">{category}</p>
    {#each leaderboardsWithNames as menuItem}
      <MenuItem
        text={menuItem.name}
        onClick={() => onMenuItemClick(menuItem.infoWithCategory.name)}
        selected={selectedPage == menuItem.infoWithCategory.name}
      />
    {/each}
    <br />
  {/each}

  <p class="flex-none text-center hidden sm:block">
    Public Alpha. Please ping @vanorsigma for feedback
  </p>
</div>
