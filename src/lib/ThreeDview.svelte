<script lang="ts">
  import { onMount } from "svelte";
  import * as Cesium from "cesium";
  import {
    Cartesian3,
    createOsmBuildingsAsync,
    Ion,
    Math as CesiumMath,
    Terrain,
    Viewer,
  } from "cesium";
  import "cesium/Build/Cesium/Widgets/widgets.css";

  // window.CESIUM_BASE_URL = '/';

  onMount(async () => {
    Ion.defaultAccessToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2YTZlNTY2Zi1mNGY1LTQ2Y2EtYTA1ZS0xZmFhZjYwZGI5NDYiLCJpZCI6Mjk0MDQxLCJpYXQiOjE3NDQ2NTA0MzR9.noUc-GDwJGe5SCmqKtr4P0UnGgnu2f3bx9ww6DolHzY";

    const viewer = new Viewer("cesiumContainer", {
      terrain: Terrain.fromWorldTerrain(),
    });

    // Set camera to Minneapolis
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(-93.265, 44.9778, 5000), // Minneapolis
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-30.0),
      },
    });

    // After a short delay, fly to San Francisco
    setTimeout(() => {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400), // San Francisco
        orientation: {
          heading: CesiumMath.toRadians(0.0),
          pitch: CesiumMath.toRadians(-15.0),
        },
        duration: 5,
      });
    }, 2000);

    const buildingTileset = await createOsmBuildingsAsync();
    viewer.scene.primitives.add(buildingTileset);
  });
</script>

<div id="cesiumContainer"></div>

<style>
  #cesiumContainer {
    width: 100%;
    height: 100vh;
    display: block;
  }
</style>
