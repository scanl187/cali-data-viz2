<script>
  //@ts-nocheck
  import { onMount } from "svelte";
  import * as d3 from "d3";

  export let progress = 0;

  let svg;
  let data = [];
  let counties = [];

  const yearExtent = [2000, 2023];
  $: selectedYear = yearExtent[0] + Math.round((progress / 100) * (yearExtent[1] - yearExtent[0]));

  const width = 850;
  const height = 600;

  const countyLayout = [
    { name: "Del Norte", col: 3, row: 0 },
    { name: "Siskiyou", col: 4, row: 0 },
    { name: "Modoc", col: 5, row: 0 },
    { name: "Humboldt", col: 3, row: 1 },
    { name: "Trinity", col: 4, row: 1 },
    { name: "Shasta", col: 5, row: 1 },
    { name: "Lassen", col: 6, row: 1 },
    { name: "Mendocino", col: 3, row: 2 },
    { name: "Tehama", col: 4, row: 2 },
    { name: "Plumas", col: 5, row: 2 },
    { name: "Nevada", col: 6, row: 2 },
    { name: "Lake", col: 3, row: 3 },
    { name: "Glenn", col: 4, row: 3 },
    { name: "Butte", col: 5, row: 3 },
    { name: "Sierra", col: 6, row: 3 },
    { name: "Sonoma", col: 3, row: 4 },
    { name: "Colusa", col: 4, row: 4 },
    { name: "Yuba", col: 5, row: 4 },
    { name: "El Dorado", col: 6, row: 4 },
    { name: "Napa", col: 3, row: 5 },
    { name: "Sutter", col: 4, row: 5 },
    { name: "Placer", col: 5, row: 5 },
    { name: "Sacramento", col: 6, row: 5 },
    { name: "Solano", col: 3, row: 6 },
    { name: "Yolo", col: 4, row: 6 },
    { name: "Amador", col: 5, row: 6 },
    { name: "Alpine", col: 6, row: 6 },
    { name: "Marin", col: 2, row: 6 },
    { name: "San Francisco", col: 2, row: 7 },
    { name: "Contra Costa", col: 3, row: 7 },
    { name: "San Joaquin", col: 4, row: 7 },
    { name: "Calaveras", col: 5, row: 7 },
    { name: "Tuolumne", col: 6, row: 7 },
    { name: "Alameda", col: 2, row: 8 },
    { name: "Stanislaus", col: 3, row: 8 },
    { name: "Mono", col: 7, row: 8 },
    { name: "Merced", col: 4, row: 8 },
    { name: "Mariposa", col: 5, row: 8 },
    { name: "San Mateo", col: 2, row: 9 },
    { name: "Santa Clara", col: 3, row: 9 },
    { name: "Madera", col: 4, row: 9 },
    { name: "Fresno", col: 5, row: 9 },
    { name: "Inyo", col: 6, row: 9 },
    { name: "Santa Cruz", col: 2, row: 10 },
    { name: "San Benito", col: 3, row: 10 },
    { name: "Monterey", col: 4, row: 10 },
    { name: "Kings", col: 5, row: 10 },
    { name: "Tulare", col: 6, row: 10 },
    { name: "San Luis Obispo", col: 3, row: 11 },
    { name: "Kern", col: 5, row: 11 },
    { name: "San Bernardino", col: 6, row: 11 },
    { name: "Santa Barbara", col: 3, row: 12 },
    { name: "Ventura", col: 4, row: 12 },
    { name: "Los Angeles", col: 5, row: 12 },
    { name: "Orange", col: 6, row: 12 },
    { name: "San Diego", col: 5, row: 13 }
  ];

  const hexRadius = 25;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const hexHeight = 2 * hexRadius * 0.75;

  let overallMax = 1;

  onMount(async () => {
    const raw = await d3.csv("./fire_points.csv", d3.autoType);
    data = raw.filter((d) => d.latitude && d.longitude && d.county);
    overallMax = d3.max(data, d => d.acres) || 1;
  });

  $: if (svg && data.length && selectedYear !== undefined) {
    drawHexMap();
  }

  function drawHexagonPath(radius) {
    const angle = Math.PI / 3;
    return d3.range(6).map(i => {
      const x = radius * Math.cos(angle * i);
      const y = radius * Math.sin(angle * i);
      return [x, y];
    }).reduce((path, [x, y], i) => {
      return path + (i === 0 ? `M${x},${y}` : `L${x},${y}`);
    }, "") + "Z";
  }

  function drawHexMap() {
    const svgSel = d3.select(svg).attr("width", width).attr("height", height);
    svgSel.selectAll("*").remove();

    const yearData = data.filter((d) => d.year === selectedYear);
    const acresByCounty = d3.rollup(
      yearData,
      (v) => d3.sum(v, (d) => d.acres),
      (d) => d.county
    );

    const color = d3.scaleSequential(d3.interpolateReds)
      .domain([0, overallMax]);

    const hexPath = drawHexagonPath(hexRadius);

    countyLayout.forEach(({ name, col, row }) => {
      const xOffset = col * hexWidth + (row % 2 === 0 ? 0 : hexWidth / 2) + 60;
      const yOffset = row * hexHeight + 60;

      svgSel.append("path")
        .attr("d", hexPath)
        .attr("transform", `translate(${xOffset},${yOffset})`)
        .attr("fill", color(acresByCounty.get(name) || 0))
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.8);

      svgSel.append("text")
        .attr("x", xOffset)
        .attr("y", yOffset + 4)
        .text(name)
        .attr("text-anchor", "middle")
        .attr("font-size", 8)
        .attr("fill", "#222");
    });

    const legendHeight = 150;
    const legendWidth = 12;
    const gradientId = "legend-gradient";
    const legendX = width - 200;

    const defs = svgSel.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%").attr("y1", "100%")
      .attr("x2", "0%").attr("y2", "0%");

    const stops = d3.range(0, 1.01, 0.1);
    stops.forEach((s) => {
      gradient.append("stop")
        .attr("offset", `${s * 100}%`)
        .attr("stop-color", color(s * overallMax));
    });

    svgSel.append("rect")
      .attr("x", legendX)
      .attr("y", 20)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`);

    const legendScale = d3.scaleLinear()
      .domain([0, overallMax])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);
    svgSel.append("g")
      .attr("transform", `translate(${legendX + legendWidth + 8}, 20)`)
      .call(legendAxis);

    svgSel.append("text")
      .attr("x", legendX - 10)
      .attr("y", 14)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text("Acres burned");
  }
</script>

<div class="year-label">
  <strong>Year:</strong> {selectedYear}
</div>

<svg bind:this={svg}></svg>

<style>
  .year-label {
    text-align: center;
    font-size: 1.2rem;
    margin-bottom: 10px;
    color: #3e2c28;
  }
</style>
