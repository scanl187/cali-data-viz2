<script lang="ts">
  import Scroll from "$lib/Scroll.svelte";
  import { slide, fly } from "svelte/transition";
  import { fade } from "svelte/transition";
  import Seasons from "$lib/Seasons.svelte";
  import SeasonsOld from "$lib/SeasonsOld.svelte";
  import CountyHeatmap from "$lib/CountyHeatmap.svelte";
  import ParallelCoordsWithDualCharts from "$lib/ParallelCoordsWithDualCharts.svelte";
  import FireDurationAndPrecip from "$lib/FireDurationAndPrecip.svelte";
  import HexbinMap from "$lib/HexbinMap.svelte";
  import { onMount } from "svelte";
  import { base } from "$app/paths";

  let progress = $state(0);

  // ACTIVE SECTION STATE
  let activeSection = $state("GEOGRAPHICAL");

  let showTeam = $state(false);
  let screenWidth = $state(0);

  function getQuestionText() {
    if (activeSection === "ENVIRONMENTAL") {
      return "How do climate factors like precipitation, temperature, and wind influence wildfire frequency and severity?";
    } else if (activeSection === "GEOGRAPHICAL") {
      return "How have California wildfires evolved over time in terms of frequency, size, and severity?";
    } else if (activeSection === "SEASONAL") {
      return "How do seasonal changes influence wildfire frequency and severity?";
    }
    return "";
  }

  // Process text into array of characters
  let questionText = $derived(getQuestionText());
  let showQuestion = $derived(progress > 0 && progress < 10);
  let showFacts = $derived(progress >= 12 && progress <= 100);
  let showVisualizations = $derived(progress >= 10);

  // Calculate question container width based on progress
  let questionContainerClass = $derived(() => {
    if (progress < 10) {
      return "col-md-10 question-expanded";
    } else {
      return "col-md-4";
    }
  });
  const seasonalFacts = [
    // 15 - 35 (Early 1990s Baseline)
    {
      year: "1992–1995 - Moderate Winter Activity",
      text: "Winter fire counts typically ranged between 100–400. (Example: 1992 — January 92, February 54, December 101.)",
      startProgress: 15,
      endProgress: 22,
    },
    {
      year: "1992–1995 - Consistently High Summer Peaks",
      text: "Summer months consistently peaked with high fire activity — June, July, and August each over 2,000 fires in 1992.",
      startProgress: 23,
      endProgress: 29,
    },
    {
      year: "1992–1995 - Lower Overall Fire Totals",
      text: "Overall annual totals, like ~7,381 fires in 1995, reflect a baseline of moderate activity and lower fuel accumulation.",
      startProgress: 30,
      endProgress: 35,
    },

    // 36 - 55 (Mid 2000s - Emerging Extremes)
    {
      year: "2006 - Record Summer Outlier",
      text: "July 2006 experienced 2,933 fires — a record-setting month, driven by extreme fuel-drying conditions.",
      startProgress: 36,
      endProgress: 41,
    },
    {
      year: "2006 - Winter Fire Counts Rise",
      text: "Winter fire counts started increasing (e.g., January 240, December 400), indicating shifting seasonal patterns.",
      startProgress: 42,
      endProgress: 47,
    },
    {
      year: "2006 - Fuel Build-Up Notice",
      text: "Decades of wildfire suppression led to denser, highly combustible vegetation and shrubs by the mid-2000s.",
      startProgress: 48,
      endProgress: 55,
    },

    // 56 - 75 (Late 2000s - Extreme Activity 2007)
    {
      year: "2007 - Sharp Rise in Fire Events",
      text: "Total estimated fires reached ~13,428 in 2007 — nearly doubling historical averages.",
      startProgress: 56,
      endProgress: 61,
    },
    {
      year: "2007 - Atypical Winter Anomalies",
      text: "Winter fires skyrocketed in January 2007 alone, exceeding 1,400 fires — far above normal winter activity.",
      startProgress: 62,
      endProgress: 68,
    },
    {
      year: "2007 - Sustained Extreme Summers",
      text: "Summer months like July (2,283 fires) and August (1,819 fires) continued the extreme fire trends.",
      startProgress: 69,
      endProgress: 75,
    },

    // 76 - 90 (Drivers Behind Seasonal Changes)
    {
      year: "Driver - Fuel Accumulation Over Decades",
      text: "Historical fire suppression allowed fine fuels to build up significantly, enhancing fire potential.",
      startProgress: 76,
      endProgress: 79,
    },
    {
      year: "Driver - Climate Change Extremes",
      text: "Higher temperatures, extended droughts (2007–09), and lower humidity contributed to more fire weather days.",
      startProgress: 80,
      endProgress: 83,
    },
    {
      year: "Driver - Shifts in Precipitation Patterns",
      text: "Reduced and delayed winter rainfall left vegetation drier for longer periods, encouraging winter fires.",
      startProgress: 84,
      endProgress: 87,
    },
    {
      year: "Driver - Lightning Activity Increases",
      text: "Warmer, stormier conditions boosted convective lightning — increasing ignition sources, especially under 'hot-wet' setups.",
      startProgress: 88,
      endProgress: 90,
    },

    // 91 - 100 (Conclusion)
    {
      year: "Conclusion - Seasonal Fire Regime Shifts",
      text: "California’s wildfire seasons have evolved drastically, reflecting fuel build-up, climate shifts, and altered precipitation patterns.",
      startProgress: 91,
      endProgress: 100,
    },
  ];

  let seasonalVisibleFacts = $derived(
    seasonalFacts.filter(
      (f) => progress >= f.startProgress && progress <= f.endProgress,
    ),
  );
  const wildfireFacts = [
    // 15 - 30 (Early 1990s - Baseline)
    {
      year: "1992–1995 - Baseline Wildfire Distribution",
      text: "Fires were moderately distributed across most California counties, with no extreme concentration areas.",
      startProgress: 15,
      endProgress: 20,
    },
    {
      year: "1992–1995 - Low Burned Acreage",
      text: "Burned acreage remained relatively low statewide, due to milder weather and minimal fuel accumulation.",
      startProgress: 21,
      endProgress: 30,
    },

    // 31 - 50 (Mid 2000s - Hotspots Emerging)
    {
      year: "Mid-2000s - Rising Hotspots",
      text: "Certain counties, especially Riverside in Southern California, started to show a noticeable rise in wildfire counts.",
      startProgress: 31,
      endProgress: 40,
    },
    {
      year: "Mid-2000s - Acreage Growth Begins",
      text: "Regions with higher fire frequencies also began seeing larger burned areas, driven by drier conditions and worsening fuels.",
      startProgress: 41,
      endProgress: 50,
    },

    // 51 - 65 (2007 Peak Year)
    {
      year: "2007 - Fire Ignitions Surge",
      text: "The pivotal year 2007 witnessed a record 13,377 fire ignition events — a clear escalation from prior trends.",
      startProgress: 51,
      endProgress: 58,
    },
    {
      year: "2007 - Burned Acreage Spike",
      text: "The acreage burned also dramatically increased in 2007, signaling a shift to larger, more severe wildfire events.",
      startProgress: 59,
      endProgress: 65,
    },

    // 66 - 80 (Drivers Behind Geography Patterns)
    {
      year: "Geographic Drivers - Urban Influence",
      text: "Counties near urban areas (like Riverside) experienced frequent, smaller fires, driven by local ignition factors and management practices.",
      startProgress: 66,
      endProgress: 73,
    },
    {
      year: "Geographic Drivers - Wildland Size Matters",
      text: "Counties with vast wildlands (San Diego, Los Angeles) saw fewer fires but significantly higher acreage burned per event.",
      startProgress: 74,
      endProgress: 80,
    },

    // 81 - 90 (Conclusion)
    {
      year: "Conclusion - Fire Patterns Over Time",
      text: "From moderate 1990s fires to 2007’s extremes, California's wildfire geography has evolved due to climate stress, fuel build-up, and topography.",
      startProgress: 81,
      endProgress: 90,
    },

    // 91 - 1000 (Trivia)
    {
      year: "Extreme Burned Acreage ",
      text: "Some years saw burned acreage spike over 210%, even hitting an incredible 1343% jump — showcasing the volatility of wildfire seasons. Why?",
      startProgress: 91,
      endProgress: 1000,
    },
  ];

  let wildfireVisibleFacts = $derived(
    wildfireFacts.filter(
      (f) => progress >= f.startProgress && progress <= f.endProgress,
    ),
  );

  const precipFacts = [
    {
      year: "2013–2015",
      text: "These three years saw low to medium precipitation on an average in all of California.",
      startProgress: 15,
      endProgress: 70,
    },
    {
      year: "2016–2018",
      text: "2016, 2017 & 2018 were years of low to medium precipitation in California.",
      startProgress: 46,
      endProgress: 75,
    },
    {
      year: "Pivotal Year: 2019",
      text: "2019 was a year of high precipitation across California.",
      startProgress: 60,
      endProgress: 100,
    },
    {
      year: "Conclusion: Precipitation & Wildfires and Climate Patterns",
      text: `Precipitation & Wildfires:
– Lower precipitation years tend to have increased wildfire activity due to drier vegetation.
Climate Patterns:
– Year-to-year precipitation variation shows California's vulnerability to drought cycles.
  `,
      startProgress: 80,
      endProgress: 1000,
    },
  ];

  // Function to get scale for each fact based on its progress
  function getFactScale(fact) {
    if (!fact) return { fontSize: "1rem", opacity: 0 };

    // Calculate where we are in the fact's display range
    const range = fact.endProgress - fact.startProgress;
    const position = progress - fact.startProgress;
    const ratio = position / range;

    // Start large, then shrink as we approach endProgress
    const fontSize = Math.max(36 - 22 * ratio, 14) + "px";
    const opacity = Math.max(1 - 0.8 * ratio, 0.2);

    return { fontSize, opacity };
  }

  let visibleFacts = $derived(
    precipFacts.filter(
      (f) => progress >= f.startProgress && progress <= f.endProgress,
    ),
  );

  // Adjust visualization position based on screen size
  onMount(() => {
    // Get initial screen width
    screenWidth = window.innerWidth;

    // Update on resize
    const handleResize = () => {
      screenWidth = window.innerWidth;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });
</script>

<!-- Fixed Header (outside of Scroll) -->
<header class="fixed-top">
  <div class="container-fluid">
    <div class="menu-bar">
      <h1>GOLDEN STATE OF FIRE</h1>
      <p>{progress}</p>
      <div class="team-icon" onclick={() => (showTeam = !showTeam)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#3e2c28"
        >
          <path
            d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 
               2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 
               10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.02 1.97 
               3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
          />
        </svg>
      </div>
    </div>

    <div class="horizontal-buttons">
      <div class="row">
        
        <div class="col-4">
          <button
            class="btn w-100 {activeSection === 'GEOGRAPHICAL'
              ? 'active-btn'
              : ''}"
            onclick={() => (activeSection = "GEOGRAPHICAL")}
          >
            GEOGRAPHICAL
          </button>
        </div>
        <div class="col-4">
          <button
            class="btn w-100 {activeSection === 'ENVIRONMENTAL'
              ? 'active-btn'
              : ''}"
            onclick={() => (activeSection = "ENVIRONMENTAL")}
          >
            ENVIRONMENTAL
          </button>
        </div>
        <div class="col-4">
          <button
            class="btn w-100 {activeSection === 'SEASONAL' ? 'active-btn' : ''}"
            onclick={() => (activeSection = "SEASONAL")}
          >
            SEASONAL
          </button>
        </div>
       
      </div>
    </div>

    {#if showTeam}
      <div class="team-members">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>GitHub</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dipan Bag</td>
              <td>bag00003@umn.edu</td>
              <td>dipan99</td>
            </tr>
            <tr>
              <td>Aarav Kalkar</td>
              <td>kalka046@umn.edu</td>
              <td>aarav2703</td>
            </tr>
            <tr>
              <td>Brandt Kringlie</td>
              <td>kring089@umn.edu</td>
              <td>bkringlie</td>
            </tr>
            <tr>
              <td>Shane Lentsch</td>
              <td>lents084@umn.edu</td>
              <td>Shane-Lentsch</td>
            </tr>
            <tr>
              <td>Marc Scanlan</td>
              <td>scanl187@umn.edu</td>
              <td>scanl187</td>
            </tr>
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</header>

<main class="pt-5 mt-5">
  <div class="container-fluid">
    <div class="row">
      <!-- Left column for facts -->
      <div class="col-md-4">
        <div
          class="content"
          style="max-width: 120rem; min-width: 40rem; position: fixed; z-index: 999;"
        >
          <p
            class="question-text mt-custom"
            style="
          font-size: {Math.max(48 - progress * 5, 15)}px; 
          padding: {Math.max(40 - progress * 4, 5)}px;
          min-height: {Math.max(200 - progress * 20, 50)}px;
          "
          >
            {questionText}
          </p>
        </div>

        {#if (activeSection == "GEOGRAPHICAL" && wildfireVisibleFacts.length > 0) || (activeSection == "SEASONAL" && seasonalVisibleFacts.length > 0) || (activeSection == "ENVIRONMENTAL" && visibleFacts.length > 0)}
          <div class="fixed-left-facts mt-custom" style="margin-top: 6rem;">
            {#if activeSection == "GEOGRAPHICAL"}
              {#each wildfireVisibleFacts as fact (fact.year)}
                {@const scale = getFactScale(fact)}
                <div
                  class="fact-box"
                  in:fly={{ y: 50, duration: 600 }}
                  out:fade={{ duration: 300 }}
                  style="opacity: {scale.opacity}; transition: all 2s ease-in-out;"
                >
                  <h3 style="font-size: {scale.fontSize};">{fact.year}</h3>
                  <p
                    style="font-size: calc({scale.fontSize} * 0.7); white-space: pre-line;"
                  >
                    {fact.text}
                  </p>
                </div>
              {/each}
            {/if}

            {#if activeSection == "SEASONAL"}
              {#each seasonalVisibleFacts as fact (fact.year)}
                {@const scale = getFactScale(fact)}
                <div
                  class="fact-box"
                  in:fly={{ y: 50, duration: 600 }}
                  out:fade={{ duration: 300 }}
                  style="opacity: {scale.opacity}; transition: all 2s ease-in-out;"
                >
                  <h3 style="font-size: {scale.fontSize};">{fact.year}</h3>
                  <p
                    style="font-size: calc({scale.fontSize} * 0.7); white-space: pre-line;"
                  >
                    {fact.text}
                  </p>
                </div>
              {/each}
            {/if}

            {#if activeSection == "ENVIRONMENTAL"}
              {#each visibleFacts as fact (fact.year)}
                {@const scale = getFactScale(fact)}
                <div
                  class="fact-box"
                  in:fly={{ y: 50, duration: 600 }}
                  out:fade={{ duration: 300 }}
                  style="opacity: {scale.opacity}; transition: all 2s ease-in-out;"
                >
                  <h3 style="font-size: {scale.fontSize};">{fact.year}</h3>
                  <p
                    style="font-size: calc({scale.fontSize} * 0.7); white-space: pre-line;"
                  >
                    {fact.text}
                  </p>
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      </div>

      <!-- Right column for question and visualizations -->
      <div class={questionContainerClass} style="transition: all 0.8s ease;">
        <Scroll bind:progress>
          <div id="virtual"></div>
          <div></div>
          <div slot="viz" class="viz-content mt-custom">
            <!-- <div class="content mt-5">
              {#if showQuestion}
                <p
                  class="question-text mt-5"
                  style="font-size: {Math.max(48 - progress * 5, 12)}px; 
                          padding: {Math.max(40 - progress * 4, 5)}px;
                          min-height: {Math.max(200 - progress * 20, 50)}px;
                          opacity: {Math.max(1 - progress * 0.1, 0.1)};"
                >
                  {questionText}
                </p>
              {/if}
            </div> -->
          </div>
        </Scroll>
      </div>

      <!-- Visualization section that appears at progress >= 10 -->
      <!-- Visualization section that appears at progress >= 10 -->
      <div class="col-md-8">
        {#if showVisualizations}
          {#if activeSection === "SEASONAL"}
            <div
              class="fixed-right-visualizations mt-custom"
              in:fly={{ y: 200, duration: 800, delay: 300 }}
            >
              <div class="viz-container">
                <Seasons
                  csvPath="./fire_climate_data.csv"
                  currentProgress={progress}
                />
                <!-- <p class="small text-muted">Progress: {progress}</p> -->
              </div>

              <div class="viz-container">
                <SeasonsOld
                  csvPath="./fire_climate_data.csv"
                  currentProgress={progress}
                />
                <!-- <p class="small text-muted">Progress: {progress}</p> -->
              </div>
            </div>
          {:else}
            <div
              class="fixed-right-visualizations d-flex flex-row"
              in:fly={{ y: 200, duration: 800, delay: 300 }}
            >
              <div class="viz-container mt-4 flex-fill me-3">
                {#if activeSection === "ENVIRONMENTAL"}
                  <FireDurationAndPrecip {progress} />
                {:else if activeSection === "GEOGRAPHICAL"}
                  <HexbinMap
                    csvPath="./fire_points_updated.csv"
                    geojsonPath="./california-counties.geojson"
                    {progress}
                  />
                {/if}
                <!-- <p class="small text-muted">Progress 1: {progress}</p> -->
              </div>

              <div class="viz-container mb-4 mt-4 flex-fill ms-3">
                {#if activeSection === "ENVIRONMENTAL"}
                  <ParallelCoordsWithDualCharts {progress} />
                {:else if activeSection === "GEOGRAPHICAL"}
                  <CountyHeatmap
                    csvPath="./fire_points_updated.csv"
                    initialStartYear={1992}
                    initialEndYear={2020}
                    initialTopN={5}
                    {progress}
                  />
                {/if}
                <!-- <p class="small text-muted">Progress 2: {progress}</p> -->
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</main>

<!-- Permanent Earth Button -->
<div class="fixed-earth-button">
  <a href="{base}/immersive">
    <img src="./earth.gif" alt="earthpic" />
    <p>Immersive (3D) mode</p>
  </a>
</div>

<style>
  :global(body),
  :global(html) {
    margin: 0;
    padding: 0;
    width: 100%;
    overflow-x: hidden;
  }

  /* Fixed header styling compatible with Bootstrap */
  header {
    width: 100%;
    background-color: #fef9f6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  /* Bootstrap overrides for consistent design */
  .menu-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #dcd2c5;
    padding: 1rem 2rem;
    color: #3e2c28;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .menu-bar h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    margin: 0 auto;
    text-align: center;
    flex: 1;
  }

  .team-icon {
    width: 32px;
    height: 32px;
    cursor: pointer;
    fill: #3e2c28;
    transition: transform 0.2s ease;
  }

  .team-icon:hover {
    transform: scale(1.2);
  }

  .horizontal-buttons {
    background-color: #fef9f6;
    padding: 10px 0;
  }

  .horizontal-buttons .btn {
    background-color: #cc5c3c;
    color: white;
    border: none;
    font-weight: 500;
    transition: background-color 0.3s ease;
  }

  .horizontal-buttons .btn:hover {
    background-color: #a9442e;
  }

  .horizontal-buttons .active-btn {
    background-color: #a9442e;
    font-weight: 700;
    transform: scale(1.02);
  }

  /* Virtual height for scrolling */
  #virtual {
    height: 900vh;
    background-color: #fef9f6;
  }

  /* Question expanded state */
  .question-expanded {
    margin: 0 auto;
  }

  /* Facts styling */
  .fixed-left-facts {
    position: fixed;
    top: 140px; /* Adjust based on header height */
    left: 20px;
    width: calc(33% - 60px); /* Half of screen minus some padding */
    display: flex;
    flex-direction: column;
    gap: 20px;
    z-index: 100;
    max-height: calc(100vh - 160px); /* Calculate height to fit screen */
    overflow-y: none; /* Allow scrolling if facts are tall */
  }

  .fact-box {
    background-color: rgba(204, 92, 60, 0.1);
    border-left: 4px solid #cc5c3c;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .fact-box h3 {
    color: #a9442e;
    margin-bottom: 10px;
    transition: all 0.5s ease-in-out;
  }

  .fact-box p {
    color: #3e2c28;
    margin-bottom: 0;
    transition: all 0.5s ease-in-out;
  }

  /* Fixed visualizations on the right */
  .fixed-right-visualizations {
    position: fixed;
    top: 140px; /* Adjust based on header height */
    right: 20px;
    width: calc(66% - 30px); /* Half of screen minus some padding */
    display: flex;
    flex-direction: column;
    /* gap: 20px; */
    z-index: 100;
    max-height: calc(100vh - 160px);
    height: 45rem;
    overflow-y: auto; /* Allow scrolling if visualizations are tall */
  }

  /* Handle responsive layout */
  @media (max-width: 768px) {
    .fixed-right-visualizations,
    .fixed-left-facts {
      position: static;
      width: 100%;
      margin-top: 20px;
    }
  }

  .viz-container {
    background-color: #ebe5df;
    border: 1px solid #d4c2b1;
    border-radius: 8px;
    color: #3e2c28;
    padding: 1rem;
    width: 100%;
    /* height: 35rem; */
    height: 72vh;
  }

  /* Content area */
  .content {
    padding: 10px 20px;
    text-align: center;
    color: #5c3b2e;
  }

  /* Team members popup styling */
  .team-members {
    background-color: #fef9f6;
    color: #3e2c28;
    border: 1px solid #dcd2c5;
    border-radius: 10px;
    padding: 1rem;
    margin: 1rem auto;
    max-width: 90%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1001;
    animation: fadeIn 0.3s ease-in-out;
  }

  .mt-custom {
    margin-top: 4rem;
  }

  .question-text {
    transition: all 0.5s ease-in-out;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    font-weight: 500;
    line-height: 1.4;
    max-width: 90%;
    margin-left: auto;
    margin-right: auto;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px) translateX(-50%);
    }
    to {
      opacity: 1;
      transform: translateY(0) translateX(-50%);
    }
  }
  .fixed-earth-button {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 999;
    text-align: center;
  }

  .fixed-earth-button img {
    height: 5rem;
    width: 5rem;
    transition: transform 0.3s ease;
  }

  .fixed-earth-button img:hover {
    transform: scale(1.1);
  }

  .fixed-earth-button p {
    color: #3e2c28;
    font-weight: bold;
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
</style>