<script lang="ts">
  import { loadImageAsBase64URL, RankType } from './rankutils';
  const fontFamily = 'Comic Sans MS';
  export let username = 'alternate person';
  export let eloScore = 1401.0;
  export let rank = 4;
  export let avatarUrl =
    'https://atlas-content-cdn.pixelsquid.com/stock-images/egg-z0nrae1-600.jpg';
  export let iconUrl =
    'https://i.pinimg.com/originals/c1/8a/8e/c18a8e6298ce417e595b4ddec7bc486b.png';

  $: rankType =
    rank === 1
      ? RankType.GOLD
      : rank === 2
        ? RankType.SILVER
        : rank === 3
          ? RankType.BRONZE
          : RankType.NORMAL;

  const rankMapping = {
    [RankType.NORMAL]: {
      // relativeWidth: '[80%]',
      relativeWidth: 'full',
      width: 346,
      fill: '#ebbcbd',
      textColor: 'black'
    },
    [RankType.SILVER]: {
      // relativeWidth: '[95%]',
      relativeWidth: 'full',
      width: 346,
      fill: 'url(#mx-gradient-4d4d4d-1-c0c0c0-1-e-0)',
      textColor: 'white'
    },
    [RankType.BRONZE]: {
      // relativeWidth: '[90%]',
      relativeWidth: 'full',
      width: 346,
      fill: 'url(#mx-gradient-613e00-1-ffb570-1-e-0)',
      textColor: 'white'
    },
    [RankType.GOLD]: {
      relativeWidth: 'full',
      width: 346,
      fill: 'url(#mx-gradient-ffd700-1-ffb570-1-e-0)',
      textColor: 'black'
    }
  };

  var avatarUrlResolved = '';
  var iconUrlResolved = '';

  $: {
    const promise = async () => {
      avatarUrlResolved = await loadImageAsBase64URL(avatarUrl);
      iconUrlResolved = await loadImageAsBase64URL(iconUrl);
    };
    promise();
  }
</script>

<svg
  class={`w-${rankMapping[rankType].relativeWidth} h-auto`}
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  version="1.1"
  width={rankMapping[rankType].width}
  height="67"
  viewBox={`-0.5 -0.5 ${rankMapping[rankType].width} 67`}
>
  <g>
    <g data-cell-id="0">
      <g data-cell-id="1">
        <g data-cell-id="TQTXx6ygs8IL0Gh_ZsiX-20">
          <g style="filter: drop-shadow(rgba(0, 0, 0, 0.25) 2px 3px 2px);">
            <path
              d="M 164 54 L 14 54 Q 4 54 5.96 44.19 L 12.04 13.81 Q 14 4 24 4 L 324 4 Q 334 4 332.04 13.81 L 325.96 44.19 Q 324 54 314 54 Z"
              fill={rankMapping[rankType].fill}
              stroke="none"
              pointer-events="all"
            />
          </g>
        </g>
        <g data-cell-id="TQTXx6ygs8IL0Gh_ZsiX-21">
          <g>
            <rect
              x="24"
              y="17.75"
              width="60"
              height="30"
              fill="none"
              stroke="none"
              pointer-events="all"
            />
          </g>
          <g>
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <text
                  x="54"
                  y="36"
                  fill={rankMapping[rankType].textColor}
                  font-family={fontFamily}
                  font-size="12px"
                  text-anchor="middle">#{rank}</text
                >
              </switch>
            </g>
          </g>
        </g>
        <g data-cell-id="TQTXx6ygs8IL0Gh_ZsiX-22">
          <g>
            <rect
              x="124"
              y="14"
              width="140"
              height="30"
              fill="none"
              stroke="none"
              pointer-events="all"
            />
          </g>
          <g>
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <text
                  x="194"
                  y="34"
                  fill="rgb(0, 0, 0)"
                  font-family={fontFamily}
                  font-size="{(1 / Math.max(14, username.length)) * 190}px"
                  text-anchor="middle">{username}</text
                >
              </switch>
            </g>
          </g>
        </g>
        <g data-cell-id="TQTXx6ygs8IL0Gh_ZsiX-24">
          <g>
            <rect
              x="264"
              y="14"
              width="60"
              height="30"
              fill="none"
              stroke="none"
              pointer-events="all"
            />
          </g>
          <g>
            <g transform="translate(-0.5 -0.5)">
              <switch>
                <text
                  x="294"
                  y="33"
                  fill="rgb(0, 0, 0)"
                  font-family={fontFamily}
                  font-size="12px"
                  text-anchor="middle"
                  font-weight="bold">{eloScore.toFixed(0)}</text
                >
              </switch>
            </g>
          </g>
        </g>
        <g data-cell-id="gtfplMh8BVE9ldx_d5it-9">
          <g>
            <image
              href={avatarUrlResolved}
              x="88.07"
              y="11.04"
              width="35.93"
              height="35.93"
              crossorigin=""
            />
          </g>
        </g>
        <g data-cell-id="gtfplMh8BVE9ldx_d5it-7">
          <g>
            <image href={iconUrlResolved} x="250" y="20" width="20" height="20" crossorigin="">
            </image>
          </g>
        </g>
      </g>
    </g>
  </g></svg
>
