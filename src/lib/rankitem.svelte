<script lang="ts">
  import { onMount } from 'svelte';
  import Normal from './rankitems/normal.svelte';

  // import type { Badge } from './ranks';

  export let rank: number = NaN;
  export let username: string = '';
  export let score: number = NaN;
  export let avatarUrl: string = '';

  /* TODO: probably implement this in the SVG */
  export let delta: number = NaN;
  // export let badges: Badge[];

  export let onVisibilityChanged: (visibility: boolean) => void = () => {};
  export let onHeightChanged: (height: number) => void = () => {};

  let element: HTMLDivElement;
  const observer = new IntersectionObserver((entries) => {
    onVisibilityChanged(entries.some((entry) => entry.isIntersecting));
  });

  onMount(() => {
    element.onresize = () => {
      onHeightChanged(element.clientHeight);
    };
    onHeightChanged(element.clientHeight);
    observer.observe(element);
  });
</script>

<div bind:this={element} class="w-full h-fit">
  <Normal {avatarUrl} {rank} {username} eloScore={score} iconUrl={''} />
</div>

<!-- iconUrl={badges.length > 0 ? badges[0].image_url : ''} -->
