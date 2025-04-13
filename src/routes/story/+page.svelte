<script lang="ts">
  import { Scroll } from "$lib";
  import { slide, fly } from "svelte/transition";

  let progress: number = $state(0);

  // ACTIVE SECTION STATE
  let activeSection: string = $state("GEOGRAPHICAL");

  let showTeam: boolean = $state(false);

  // Additional imports or component logic if necessary
</script>

<Scroll bind:progress --scrolly-story-width="0" --scrolly-story-height="0" --scrolly-story-scrollbar="false" --scrolly-story-scrollbar-width="0" --scrolly-story-scrollbar-height="0" --scrolly-story-scrollbar-color="#00000000" --scrolly-story-scrollbar-radius="0" --scrolly-story-scrollbar-border-radius="0" --scrolly-story-scrollbar-border-color="#00000000" --scrolly-story-scrollbar-border-width="0" --scrolly-story-scrollbar-border-style="none">
  <div id="virtual"></div>

  <div slot="viz" class="viz-wrapper">
    <!-- MENU -->
    <div class="menu-bar">
      <!-- TITLE -->
      <h1>GOLDEN STATE OF FIRE</h1>

      <!-- TEAM ICON -->
      <div class="team-icon" onclick={() => showTeam = !showTeam}>
        <!-- MEMBERS SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#3e2c28">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 
                   2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 
                   10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 2.02 1.97 
                   3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      </div>
    </div>

    <!-- HORIZONTAL BUTTONS -->
    <div class="horizontal-buttons">
      <button 
        onclick={() => activeSection = "ENVIRONMENTAL"}
        class:active-btn={activeSection === "ENVIRONMENTAL"}>
        ENVIRONMENTAL
      </button>
      <button 
        onclick={() => activeSection = "GEOGRAPHICAL"}
        class:active-btn={activeSection === "GEOGRAPHICAL"}>
        GEOGRAPHICAL
      </button>
      <button 
        onclick={() => activeSection = "SEASONAL"}
        class:active-btn={activeSection === "SEASONAL"}>
        SEASONAL
      </button>
    </div>

    <!-- TEAM MEMBERS -->
    {#if showTeam}
    <div class="team-members">
      <table>
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
            <td>ENTER USERNAME</td>
          </tr>
          <tr>
            <td>Marc Scanlan</td>
            <td>scanl187@umn.edu</td>
            <td>ENTER USERNAME</td>
          </tr>
        </tbody>
      </table>
    </div>
    {/if}

    <!-- CONTENT -->
    <div class="content">
      <!-- QUESTION -->
      {#if progress > 5}
        {#if activeSection === "ENVIRONMENTAL"}
          <p in:slide={{ duration: 1000, axis: "x", x: 0 }}>
            How do climate factors like temperature, and wind influence wildfire frequency and severity? QUESTION 2 FROM FP2
          </p>
        {:else if activeSection === "GEOGRAPHICAL"}
          <p in:slide={{ duration: 1000, axis: "x", x: 0 }}>
            How have California wildfires evolved over time in terms of frequency, size, and severity? QUESTION 1 FROM FP2
          </p>
        {:else if activeSection === "SEASONAL"}
          <p in:slide={{ duration: 1000, axis: "x", x: 0 }}>
            How do seasonal changes influence wildfire frequency and severity? QUESTION 2 FROM FP2
          </p>
        {/if}
      {/if}
    </div>


    <!-- VISUALIZATIONS -->
    <div class="visualizations">
      <!-- IF PROGRESS LESS THAN 50 THAN 1 VISUALIZATION -->
      {#if progress < 50}
        <div class="viz-1">
          <!-- DISPLAY SELECTED VISUALIZATION -->
          {#if activeSection === "ENVIRONMENTAL"}
          <p>Insert Environmental Visualization</p>
          {:else if activeSection === "GEOGRAPHICAL"}
          <p>Insert Geographical Visualization</p>
          {:else if activeSection === "SEASONAL"}
          <p>Insert Seasonal Visualization</p>
          {/if}

          <!-- PROGRESS TRACKING -->
          <p>{progress}</p>
        </div>
      {/if}

      <!-- IF PROGRESS GREATER THAN 50 THAN 2 VISUALIZATION -->
      {#if progress > 50}
        <div class="viz-2">
          <!-- DISPLAY SELECTED VISUALIZATION -->
          {#if activeSection === "ENVIRONMENTAL"}
          <p>Insert Environmental Visualization #1</p>
          {:else if activeSection === "GEOGRAPHICAL"}
          <p>Insert Geographical Visualization #1</p>
          {:else if activeSection === "SEASONAL"}
          <p>Insert Seasonal Visualization #1</p>
          {/if}

          <!-- PROGRESS TRACKING -->
          <p>{progress}</p>
        </div>

        <div class="viz-2">
          <!-- DISPLAY SELECTED VISUALIZATION -->
          {#if activeSection === "ENVIRONMENTAL"}
          <p>Insert Environmental Visualization #2</p>
          {:else if activeSection === "GEOGRAPHICAL"}
          <p>Insert Geographical Visualization #2</p>
          {:else if activeSection === "SEASONAL"}
          <p>Insert Seasonal Visualization #2</p>
          {/if}

          <!-- PROGRESS TRACKING -->
          <p>{progress}</p>
        </div>
      {/if}
    </div>
  </div>
</Scroll>

<svelte:window bind:scrollY={progress} />

<style>
  /* GLOBAL STYLES */
    html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }

  /* FULL PAGE HEIGHT TO ENABLE SCROLLING */
  #virtual {
    height: 200vh;
    width: 100%;
    background-color: #fef9f6;
  }

  /* MAIN CONTAINER FOR VIZUALIZATION AND CONTENT */
  .viz-wrapper {
    background-color: #fef9f6; /* match body */
    min-height: 100vh;
  }

  /* TOP NAVIGATION MENU BAR */
  .menu-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fef9f6;
    border-bottom: 1px solid #dcd2c5;
    padding: 1rem 2rem;
    color: #3e2c28;
    font-weight: bold;
    letter-spacing: 1px;
  }

  /* PAGE TITLE STYLING */
  .menu-bar h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    margin: 0 auto;
    text-align: center;
    flex: 1;
  }

  /* TEAM ICON STYLING */
  .team-icon {
    width: 32px;
    height: 32px;
    cursor: pointer;
    fill: #3e2c28;
    transition: transform 0.2s ease;
  }

  /* TEAM ICON HOVER EFFECT */
  .team-icon:hover {
    transform: scale(1.2);
  }

  /* HORIZONTAL BUTTON WRAPPER */
  .horizontal-buttons {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background-color: #fef9f6;
    padding: 10px 0;
  }

  /* STYLE FOR INDIVIDUAL SECTION BUTTONS */
  .horizontal-buttons button {
    flex: 1;
    margin: 0 5px;
    padding: 10px;
    background-color: #cc5c3c;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.3s ease;
  }

  /* HOVER STATE FOR SECTION BUTTONS */
  .horizontal-buttons button:hover {
    background-color: #a9442e;
  }

  /* ACTIVE STATE FOR SELECTED SECTION BUTTON */
  .horizontal-buttons .active-btn {
    background-color: #a9442e;
    font-weight: 700;
    transform: scale(1.02);
  }

  /* CONTAINER FOR SLIDING QUESTION TEXT */
  .content {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 20px;
    text-align: center;
    color: #5c3b2e;
  }

  /* VISUALIZATION WRAPPER FOR LAYOUT */
  .visualizations {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50vh;
    padding: 10px 0;
    background-color: #f4f0ed;
    gap: 10px;
  }

  /* BOX STYLES FOR INDIVIDUAL VISUALIZATIONS */
  .viz-1,
  .viz-2 {
    width: 100%;
    height: 100%;
    padding: 1rem;
    background-color: #ebe5df;
    border: 1px solid #d4c2b1;
    border-radius: 8px;
    color: #3e2c28;
  }

  /* TEAM MEMBERS CONTAINER */
  .team-members {
    background-color: #fef9f6;
    color: #3e2c28;
    border: 1px solid #dcd2c5;
    border-radius: 10px;
    padding: 1.5rem;
    margin: 1rem auto;
    width: max-content;
    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
    font-family: inherit;
    animation: fadeIn 0.3s ease-in-out;
  }

  /* TABLE FOR TEAM INFO */
  .team-members table {
    border-collapse: collapse;
    width: 100%;
  }

  /* TEAM TABLE CELL STYLING */
  .team-members th,
  .team-members td {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e4d9cf;
  }

  /* TABLE HEADER STYLING */
  .team-members th {
    background-color: #ebe5df;
    font-weight: 600;
    color: #3e2c28;
  }

  /* FADE-IN ANIMATION FOR TEAM MEMBERS BOX */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
