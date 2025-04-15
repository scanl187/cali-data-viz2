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
    GeoJsonDataSource,
    VerticalOrigin,
    JulianDate,
  } from "cesium";
  import "cesium/Build/Cesium/Widgets/widgets.css";
  import { goto } from "$app/navigation";

  let viewer: Viewer;
  let fireData: any[] = [];
  let selectedYear = 2005;
  let availableYears: number[] = [];

  function goBack() {
    history.length > 1 ? history.back() : goto("/");
  }

  async function updateFires(year: number) {
    viewer.entities.removeAll();
    fireData
      .filter(
        (d) =>
          d.year === year &&
          typeof d.latitude === "number" &&
          typeof d.longitude === "number",
      )
      .forEach((d) => {
        const entity = viewer.entities.add({
          name: `Fire ${d.fire_name}`,
          position: Cartesian3.fromDegrees(d.longitude, d.latitude),
          billboard: {
            image: "/open-fire-11190_256.gif",
            width: 16,
            height: 16,
            verticalOrigin: VerticalOrigin.BOTTOM,
          },
          description: `
            <b>Name:</b> ${d.fire_name}<br/>
            <b>Acres:</b> ${d.acres}<br/>
            <b>County:</b> ${d.county}<br/>
            <b>Year:</b> ${d.year}
          `,
        });

        viewer.scene.postRender.addEventListener(() => {
          const cameraHeight = viewer.camera.positionCartographic.height;
          const scale = Math.min(64, Math.max(16, 800000 / cameraHeight));
          entity.billboard!.width = scale;
          entity.billboard!.height = scale;
        });
      });
  }

  function parseCSV(text: string) {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",");
    return lines.map((line) => {
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
        pitch: CesiumMath.toRadians(-45),
      },
      duration: 5,
    });
  }

  onMount(async () => {

    (window as any).CESIUM_BASE_URL = import.meta.env.BASE_URL + 'Cesium';

    Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTZlNTY2Zi1mNGY1LTQ2Y2EtYTA1ZS0xZmFhZjYwZGI5NDYiLCJpZCI6Mjk0MDQxLCJpYXQiOjE3NDQ2NTA0MzR9.noUc-GDwJGe5SCmqKtr4P0UnGgnu2f3bx9ww6DolHzY";

    viewer = new Viewer("cesiumContainer", {
      terrain: Terrain.fromWorldTerrain(),
    });

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(-93.23256, 44.97452, 500),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-90),
        roll: 0,
      },
    });

    const tileset = await createOsmBuildingsAsync();
    viewer.scene.primitives.add(tileset);

    const countySource = await GeoJsonDataSource.load(
      "/california-counties.geojson",
    );
    countySource.entities.values.forEach((entity) => {
      entity.polygon.material = Color.YELLOW.withAlpha(0.1);
      entity.polygon.outline = true;
      entity.polygon.outlineColor = Color.YELLOW;
      entity.polygon.outlineWidth = 1;
    });
    viewer.dataSources.add(countySource);

    const res = await fetch("./fire_points_updated.csv");
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
  <button on:click={goBack}>← Back</button>
  <button on:click={flyToCalifornia}>Fly Me to California</button>
  <label>
    <strong>Year:</strong>
    {selectedYear}
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
