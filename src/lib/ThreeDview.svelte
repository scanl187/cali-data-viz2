<script lang="ts">
  import { onMount } from "svelte";
  import {
    Viewer,
    Ion,
    Cartesian3,
    Math as CesiumMath,
    Terrain,
    createOsmBuildingsAsync,
    Color,
    GeoJsonDataSource
  } from "cesium";
  import "cesium/Build/Cesium/Widgets/widgets.css";

  let viewer: Viewer;
  let fireData: any[] = [];
  let selectedYear = 2005;
  let availableYears: number[] = [];

  function getColorByAcres(acres: number): Color {
    if (acres > 10000) return Color.RED;
    if (acres > 1000) return Color.ORANGE;
    if (acres > 100) return Color.YELLOW;
    return Color.GREEN;
  }

  async function updateFires(year: number) {
    viewer.entities.removeAll();
    fireData
  .filter(d => d.year === year && d.longitude && d.latitude)
      .forEach(d => {
        viewer.entities.add({
          name: `Fire ${d.fire_name}`,
          position: Cartesian3.fromDegrees(d.longitude, d.latitude),
          point: {
            pixelSize: 6,
            color: getColorByAcres(d.acres),
            outlineColor: Color.BLACK,
            outlineWidth: 1,
          },
          description: `
            <b>Name:</b> ${d.fire_name}<br/>
            <b>Acres:</b> ${d.acres}<br/>
            <b>County:</b> ${d.county}<br/>
            <b>Year:</b> ${d.year}
          `,
        });
      });
  }

  function parseCSV(text: string) {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",");
    return lines.map(line => {
      const parts = line.split(",");
      const row: any = {};
      headers.forEach((h, i) => {
        row[h.trim()] = parts[i]?.trim();
      });
      row.latitude = +row.latitude;
      row.longitude = +row.longitude;
      row.acres = +row.acres;
      row.year = +row.year;
      return row;
    });
  }

  function flyToCalifornia() {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.4175, 37.655, 2000),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-45)
      },
      duration: 5
    });
  }

  onMount(async () => {
    Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTZlNTY2Zi1mNGY1LTQ2Y2EtYTA1ZS0xZmFhZjYwZGI5NDYiLCJpZCI6Mjk0MDQxLCJpYXQiOjE3NDQ2NTA0MzR9.noUc-GDwJGe5SCmqKtr4P0UnGgnu2f3bx9ww6DolHzY";

    viewer = new Viewer("cesiumContainer", {
      terrain: Terrain.fromWorldTerrain()
    });

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(-93.23256, 44.97452, 500),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0
      }
    });

    const tileset = await createOsmBuildingsAsync();
    viewer.scene.primitives.add(tileset);

    // Load counties
    const countySource = await GeoJsonDataSource.load('/california-counties.geojson');
    countySource.entities.values.forEach(entity => {
      entity.polygon.material = Color.YELLOW.withAlpha(0.1);
      entity.polygon.outline = true;
      entity.polygon.outlineColor = Color.YELLOW;
      entity.polygon.outlineWidth = 1;
    });
    viewer.dataSources.add(countySource);

    const res = await fetch("/fire_points_updated.csv");
    const text = await res.text();
    fireData = parseCSV(text);
    availableYears = [...new Set(fireData.map((d) => +d.year))].sort();
    updateFires(selectedYear);
  });

  function onYearChange(event: Event) {
    selectedYear = +(event.target as HTMLInputElement).value;
    updateFires(selectedYear);
  }
</script>

<div class="top-controls">
  <button on:click={flyToCalifornia}>Fly Me to California</button>
  <label>
    <strong>Year:</strong> {selectedYear}
    <input
      type="range"
      min="2000"
      max="2020"
      step="1"
      bind:value={selectedYear}
      on:input={onYearChange}
    />
  </label>
</div>

<div id="cesiumContainer"></div>

<style>
  #cesiumContainer {
    width: 100%;
    height: 100vh;
    display: block;
  }

  .top-controls {
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px 20px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-family: sans-serif;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  input[type="range"] {
    width: 200px;
    margin-left: 10px;
  }
</style>
