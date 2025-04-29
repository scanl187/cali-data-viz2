<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let viewer: any;
  let fireData: any[] = [];
  let selectedYear = 2005;
  let availableYears: number[] = [];

  function goBack() {
    history.length > 1 ? history.back() : goto("/");
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

  function setupFireScaling(Cesium) {
    // Remove previous listener if it exists
    if (viewer.__fireScalingListener) {
      viewer.scene.postRender.removeEventListener(viewer.__fireScalingListener);
    }

    // Store the start time for animation
    const startTime = Cesium.JulianDate.now();

    // Create a new scaling listener
    viewer.__fireScalingListener = function () {
      const cameraHeight = viewer.camera.positionCartographic.height;
      const currentTime = Cesium.JulianDate.now();

      // Calculate elapsed seconds since animation started
      const elapsedSeconds = Cesium.JulianDate.secondsDifference(
        currentTime,
        startTime,
      );

      // Determine zoom factor based on camera height
      let zoomFactor;
      if (cameraHeight < 50000) {
        zoomFactor = 10.0; // Very close to ground
      } else if (cameraHeight < 100000) {
        zoomFactor = 5.0; // Closer
      } else if (cameraHeight < 200000) {
        zoomFactor = 2.5; // Medium distance
      } else if (cameraHeight < 500000) {
        zoomFactor = 1.0; // Default view
      } else {
        zoomFactor = 0.5; // Far away
      }

      // Apply zoom factor and bounce effect to all fire entities
      for (let i = 0; i < viewer.entities.values.length; i++) {
        const entity = viewer.entities.values[i];

        // Apply only to fire entities (those with the fire image)
        if (entity.billboard && entity.billboard.image) {
          // Get the original size
          const originalSize = entity.originalSize || 10;

          // Calculate bounce effect - each fire bounces slightly differently
          const offset = entity.bounceOffset || 0;
          const bounceSpeed = 2.0; // Cycles per second
          const bounceAmount = 0.15; // How much it bounces (15% of size)

          // Sin wave creates smooth bounce effect
          const bounceFactor =
            1.0 +
            Math.sin((elapsedSeconds + offset) * bounceSpeed * Math.PI * 2) *
              bounceAmount;

          // Apply both zoom and bounce factors
          const newSize = originalSize * zoomFactor * bounceFactor;

          // Update the billboard size
          entity.billboard.width = newSize;
          entity.billboard.height = newSize;
        }
      }
    };

    // Add the listener
    viewer.scene.postRender.addEventListener(viewer.__fireScalingListener);
  }

  async function updateFires(Cesium, year) {
    viewer.entities.removeAll();

    fireData
      .filter(
        (d) =>
          d.year === year &&
          typeof d.latitude === "number" &&
          typeof d.longitude === "number",
      )
      .forEach((d) => {
        // Calculate base size based on acres
        const baseSize = Math.min(100, Math.max(10, d.acres / 100));

        // Add the entity
        const entity = viewer.entities.add({
          name: `Fire ${d.fire_name}`,
          position: Cesium.Cartesian3.fromDegrees(d.longitude, d.latitude),
          billboard: {
            image: "./open-fire-11190_256.gif",
            width: baseSize,
            height: baseSize,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          },
          description: `
          <b>Name:</b> ${d.fire_name}<br/>
          <b>Acres:</b> ${d.acres}<br/>
          <b>County:</b> ${d.county}<br/>
          <b>Year:</b> ${d.year}
        `,
        });

        // Store the original size for scaling
        entity.originalSize = baseSize;

        // Add random offset so each fire bounces differently
        entity.bounceOffset = Math.random() * 5; // Random offset between 0-5
      });

    // Set up scaling (only once)
    setupFireScaling(Cesium);
  }

  async function flyToCalifornia(Cesium: any) {
    const rectangle = Cesium.Rectangle.fromDegrees(
      -124.48, // west
      32.53, // south
      -114.13, // east
      42.01, // north
    );

    const boundingSphere = Cesium.BoundingSphere.fromRectangle3D(rectangle);

    viewer.camera.flyToBoundingSphere(boundingSphere, {
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0), // heading
        Cesium.Math.toRadians(-25), // pitch
        300000, // range (height above)
      ),
      duration: 4,
    });
  }

  onMount(async () => {
    const Cesium = (window as any).Cesium;
    if (!Cesium) {
      console.error("Cesium not available");
      return;
    }

    Cesium.Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTZlNTY2Zi1mNGY1LTQ2Y2EtYTA1ZS0xZmFhZjYwZGI5NDYiLCJpZCI6Mjk0MDQxLCJpYXQiOjE3NDQ2NTA0MzR9.noUc-GDwJGe5SCmqKtr4P0UnGgnu2f3bx9ww6DolHzY";

    viewer = new Cesium.Viewer("cesiumContainer", {
      animation: false,
      timeline: false,
      homeButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      geocoder: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: true,
      selectionIndicator: false,
      terrain: Cesium.Terrain.fromWorldTerrain({
        requestWaterMask: false,
        requestVertexNormals: false,
      }),
    });

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-93.23256, 44.97452, 500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });

    const tileset = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(tileset);

    const countySource = await Cesium.GeoJsonDataSource.load(
      "./california-counties.geojson",
    );
    countySource.entities.values.forEach((entity) => {
      entity.polygon.material = Cesium.Color.YELLOW.withAlpha(0.1);
      entity.polygon.outline = true;
      entity.polygon.outlineColor = Cesium.Color.YELLOW;
      entity.polygon.outlineWidth = 1;

      const hierarchy = entity.polygon.hierarchy.getValue(
        Cesium.JulianDate.now(),
      );
      const positions = hierarchy.positions;

      if (positions && positions.length) {
        const center = Cesium.BoundingSphere.fromPoints(positions).center;
        const cartographic = Cesium.Cartographic.fromCartesian(center);
        const labelPosition = Cesium.Cartesian3.fromRadians(
          cartographic.longitude,
          cartographic.latitude,
          0,
        );

        entity.position = labelPosition;

        entity.label = new Cesium.LabelGraphics({
          text: entity.properties.name,
          font: "14px sans-serif",
          fillColor: Cesium.Color.BLACK,
          style: Cesium.LabelStyle.FILL,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scale: 0.8,
          showBackground: true,
          backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1e7),
          scaleByDistance: new Cesium.NearFarScalar(500, 1.2, 1_000_000, 0.1),
          // translucencyByDistance: new Cesium.NearFarScalar(
          //   500,
          //   1.0,
          //   5_000_000,
          //   0.0,
          // ),
        });
      }
    });
    viewer.dataSources.add(countySource);

    const res = await fetch("./fire_points_updated.csv");
    const text = await res.text();
    fireData = parseCSV(text);
    availableYears = [...new Set(fireData.map((d) => +d.year))].sort();

    updateFires(Cesium, selectedYear);
  });

  function onYearChange(event: Event) {
    selectedYear = +(event.target as HTMLInputElement).value;
    const Cesium = (window as any).Cesium;
    updateFires(Cesium, selectedYear);
  }
</script>

<svelte:head>
  <link
    href="https://cesium.com/downloads/cesiumjs/releases/1.128/Build/Cesium/Widgets/widgets.css"
    rel="stylesheet"
  />
  <script
    src="https://cesium.com/downloads/cesiumjs/releases/1.128/Build/Cesium/Cesium.js"
    defer
  ></script>
</svelte:head>

<div class="top-controls">
  <button on:click={goBack}>← Back</button>
  <button on:click={() => flyToCalifornia((window as any).Cesium)}
    >Fly Me to California</button
  >
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
