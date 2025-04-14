<script>
    import { onMount, onDestroy } from 'svelte';
    import * as d3 from 'd3';
  
    export let csvPath = '/fire_climate_data.csv';
  
    let container;
    let tableContainer;
  
    let data = [];
    let aggData = [];
    let currentDate;
    let maxDate;
    let interval;
  
    let tableStart = 0;
    let maxTableIndex = 0;
  
    let svg, g, x, y, color;
    const margin = { top: 60, right: 150, bottom: 60, left: 80 };
    const width = 800, height = 400;
    let innerWidth = width - margin.left - margin.right;
    let innerHeight = height - margin.top - margin.bottom;
  
    onMount(async () => {
      data = await d3.csv(csvPath, d => {
        const year = +d.YEAR, month = +d.MONTH;
        const date = new Date(year, month - 1, 1);
        return {
          YEAR: year,
          MONTH: month,
          fire_count: +d.fire_count,
          SEASON: d.SEASON,
          date
        };
      });
  
      data.sort((a, b) => a.date - b.date);
      currentDate = data[0].date;
      maxDate = data[data.length - 1].date;
  
      const aggMap = d3.rollup(
        data,
        v => ({
          total: d3.sum(v, d => d.fire_count),
          Winter: d3.sum(v.filter(d => d.SEASON === 'Winter'), d => d.fire_count),
          Spring: d3.sum(v.filter(d => d.SEASON === 'Spring'), d => d.fire_count),
          Summer: d3.sum(v.filter(d => d.SEASON === 'Summer'), d => d.fire_count),
          Fall: d3.sum(v.filter(d => d.SEASON === 'Fall'), d => d.fire_count)
        }),
        d => d.YEAR
      );
  
      aggData = Array.from(aggMap, ([year, values]) => ({ YEAR: +year, ...values }))
                     .sort((a, b) => a.YEAR - b.YEAR);
  
      maxTableIndex = Math.max(0, aggData.length - 7);
  
      initChart();
      updateTable();
  
      interval = d3.interval(() => {
        currentDate = d3.timeMonth.offset(currentDate, 1);
        updateChart();
        updateTable();
        if (currentDate > maxDate) interval.stop();
      }, 100);
    });
  
    onDestroy(() => {
      if (interval) interval.stop();
    });
  
    function initChart() {
      svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
  
      svg.append("text")
        .attr("x", (width - margin.right) / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "24px")
        .attr("font-weight", "bold")
        .text("Monthly Fire Count with Season-Based Color (1992–2020)");
  
      g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, innerWidth]);
  
      y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.fire_count)]).nice()
        .range([innerHeight, 0]);
  
      const seasons = Array.from(new Set(data.map(d => d.SEASON)));
      color = d3.scaleOrdinal()
        .domain(seasons)
        .range(d3.schemeTableau10);
  
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y")));
  
      g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));
  
      const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
      seasons.forEach((season, i) => {
        const row = legend.append("g")
          .attr("transform", `translate(0, ${i * 25})`);
        row.append("rect")
          .attr("width", 18)
          .attr("height", 18)
          .attr("fill", color(season));
        row.append("text")
          .attr("x", 25)
          .attr("y", 14)
          .style("font-size", "14px")
          .text(season);
      });
    }
  
    function updateChart() {
      const filtered = data.filter(d => d.date <= currentDate);
      g.selectAll(".line-group").remove();
  
      const lineGroup = g.append("g").attr("class", "line-group");
      for (let i = 1; i < filtered.length; i++) {
        const d0 = filtered[i - 1], d1 = filtered[i];
        lineGroup.append("path")
          .attr("fill", "none")
          .attr("stroke", color(d0.SEASON))
          .attr("stroke-width", 2)
          .attr("d", d3.line()
            .x(d => x(d.date))
            .y(d => y(d.fire_count))([d0, d1]));
      }
    }
  
    function updateTable() {
      const currentYear = currentDate.getFullYear();
      const filteredAgg = aggData.filter(d => d.YEAR <= currentYear);
      const displayData = filteredAgg.slice(tableStart, tableStart + 7);
  
      let html = `
        <table border="1" style="border-collapse: collapse; width:100%;">
          <tr>
            <th>Year</th>
            <th>Total Fires</th>
            <th>Winter</th>
            <th>Spring</th>
            <th>Summer</th>
            <th>Fall</th>
          </tr>
      `;
      displayData.forEach(row => {
        html += `
          <tr>
            <td>${row.YEAR}</td>
            <td>${row.total}</td>
            <td>${row.Winter}</td>
            <td>${row.Spring}</td>
            <td>${row.Summer}</td>
            <td>${row.Fall}</td>
          </tr>
        `;
      });
      html += `</table>`;
      d3.select(tableContainer).html(html);
    }
  </script>
  
  <div bind:this={container} style="max-width:1200px; margin:auto;"></div>
  
  <div style="max-width:300px; margin:20px auto; text-align:center;">
    <div>
      <label for="tableSlider">Scroll Table:</label>
      <input id="tableSlider" type="range" min="0" max={maxTableIndex} bind:value={tableStart} on:input={updateTable} style="width:100%;" />
    </div>
    <div bind:this={tableContainer} style="max-height:200px; overflow-y:auto; margin-top:10px;"></div>
  </div>
  
  <style>
    svg {
      font-family: sans-serif;
    }
    table {
      font-size: 14px;
    }
  </style>
  