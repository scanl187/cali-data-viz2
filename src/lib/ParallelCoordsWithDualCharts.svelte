<script>
    //@ts-nocheck
    import { onMount } from "svelte";
    import * as d3 from "d3";
  
    let chartDiv;
    let precipChartDiv;
    let tempChartDiv;
    let windChartDiv;
    let Plotly;
    let dimensions = [];
    let selectedYears = [];
    let enrichedData = [];
    let allMetrics = [];
    let precipData, tempData, windData;
    
    // Chart visibility control
    let selectedChart = "precip";
    const chartOptions = [
      { value: "precip", label: "Precipitation vs Fire Count" },
      { value: "temp", label: "Temperature vs Fire Count" },
      { value: "wind", label: "Wind Speed vs Fire Count" }
    ];
  
    onMount(async () => {
      if (!Plotly) Plotly = (await import("plotly.js-dist"))?.default;
  
      const weatherData = await d3.csv(
        "./CA_Weather_Fire_Dataset_1984-2025.csv",
        d3.autoType
      );
      const fireData = await d3.csv("./fire_points.csv", d3.autoType);
  
      // Load the chart data files first so they're ready
      precipData = await d3.csv('/yearly_precip_fire.csv', d3.autoType);
      tempData = await d3.csv('/yearly_avgtemp_fire.csv', d3.autoType);
      windData = await d3.csv('/yearly_windspeed_fire.csv', d3.autoType);
  
      const fireCounts = d3.rollup(
        fireData,
        (v) => v.length,
        (d) => d.year
      );
  
      const metrics = [
        "PRECIPITATION",
        "MAX_TEMP",
        "MIN_TEMP",
        "AVG_WIND_SPEED",
        "TEMP_RANGE",
        "WIND_TEMP_RATIO"
      ];
  
      enrichedData = weatherData.map((d) => ({
        ...d,
        FIRE_COUNT: fireCounts.get(d.YEAR) || 0
      }));
  
      allMetrics = [...metrics, "FIRE_COUNT"];
  
      dimensions = allMetrics.map((metric) => ({
        label: metric.replace(/_/g, " "),
        values: enrichedData.map((row) => row[metric]),
        range: d3.extent(enrichedData, (d) => d[metric]),
        constraintrange: null
      }));
  
      const colorMetric = "AVG_WIND_SPEED";
      const fireColors = enrichedData.map((d) => d[colorMetric]);
      const colorScale = "Jet";
  
      Plotly.newPlot(
        chartDiv,
        [
          {
            type: "parcoords",
            line: {
              color: fireColors,
              colorscale: colorScale,
              showscale: true,
              colorbar: {
                title: colorMetric.replace(/_/g, " ")
              }
            },
            dimensions: dimensions
          }
        ],
        {
          margin: { t: 50, r: 50, l: 50, b: 30 },
          title: "California Wildfires - Parallel Coordinates",
          displaylogo: false
        }
      );
  
      chartDiv.on("plotly_restyle", updateSelectedYears);
      chartDiv.on("plotly_relayout", updateSelectedYears);
  
      // Initial chart draw with all data
      drawAllCharts();
      updateChartVisibility();
    });
  
    function updateSelectedYears(eventData) {
      // Clear previous constraints
      let filtered = enrichedData;
      
      // Get current constraints from each dimension
      dimensions.forEach((dim, i) => {
        if (dim.constraintrange) {
          // Handle both single range and multiple ranges
          const constraintRanges = Array.isArray(dim.constraintrange[0]) 
            ? dim.constraintrange 
            : [dim.constraintrange];
          
          const metric = allMetrics[i];
          filtered = filtered.filter(d => {
            return constraintRanges.some(range => {
              const [min, max] = range;
              return d[metric] >= min && d[metric] <= max;
            });
          });
        }
      });
  
      selectedYears = [...new Set(filtered.map((d) => d.YEAR))];
      
      // Redraw charts with filtered data
      clearCharts();
      drawAllCharts();
      updateChartVisibility();
    }
  
    function clearCharts() {
      d3.select(precipChartDiv).selectAll("*").remove();
      d3.select(tempChartDiv).selectAll("*").remove();
      d3.select(windChartDiv).selectAll("*").remove();
    }
  
    function drawAllCharts() {
      drawDualChart('precip', precipChartDiv, precipData);
      drawDualChart('temp', tempChartDiv, tempData);
      drawDualChart('wind', windChartDiv, windData);
    }
  
    function updateChartVisibility() {
      // Hide all charts first
      precipChartDiv.style.display = "none";
      tempChartDiv.style.display = "none";
      windChartDiv.style.display = "none";
      
      // Show only the selected chart
      if (selectedChart === "precip") {
        precipChartDiv.style.display = "block";
      } else if (selectedChart === "temp") {
        tempChartDiv.style.display = "block";
      } else if (selectedChart === "wind") {
        windChartDiv.style.display = "block";
      }
    }
  
    function handleChartSelection() {
      updateChartVisibility();
    }
  
    function drawDualChart(type, container, rawData) {
      if (!rawData || !container) return;
      
      let yMetric, label;
      if (type === 'precip') {
        yMetric = 'AvgPrecip';
        label = 'Avg Precipitation';
      } else if (type === 'wind') {
        yMetric = 'AvgWindSpeed';
        label = 'Avg Wind Speed';
      } else if (type === 'temp') {
        yMetric = 'AvgTemp';
        label = 'Avg Temperature';
      }
  
      let data = rawData.filter(d => d.YEAR && d[yMetric] != null && d.FireCount != null);
      
      // Filter by selected years if any are selected
      if (selectedYears.length > 0) {
        data = data.filter(d => selectedYears.includes(d.YEAR));
      }
  
      const margin = { top: 30, right: 60, bottom: 50, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;
      const svg = d3.select(container).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      const x = d3.scaleLinear().domain(d3.extent(data, d => d.YEAR)).range([0, width]);
      const yLeft = d3.scaleLinear().domain([0, d3.max(data, d => d[yMetric])]).nice().range([height, 0]);
      const yRight = d3.scaleLinear().domain([0, d3.max(data, d => d.FireCount)]).nice().range([height, 0]);
  
      svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
      svg.append("g").call(d3.axisLeft(yLeft));
      svg.append("g").attr("transform", `translate(${width}, 0)`).call(d3.axisRight(yRight));
  
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .text(label);
  
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", width + 45)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .text("Fire Count");
  
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2.5)
        .attr("d", d3.line().x(d => x(d.YEAR)).y(d => yLeft(d[yMetric])));
  
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "crimson")
        .attr("stroke-width", 2.5)
        .attr("d", d3.line().x(d => x(d.YEAR)).y(d => yRight(d.FireCount)));
    }
  </script>
  
  <div bind:this={chartDiv} style="width: 100%; height: 600px; max-width: 1000px;"></div>
  
  <div style="margin: 20px 0;">
    <label for="chart-select">Select Chart: </label>
    <select id="chart-select" bind:value={selectedChart} on:change={handleChartSelection}>
      {#each chartOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
  
  <div bind:this={precipChartDiv}></div>
  <div bind:this={tempChartDiv}></div>
  <div bind:this={windChartDiv}></div>