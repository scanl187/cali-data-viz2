<script>
    import { onMount, onDestroy } from 'svelte';
    import * as d3 from 'd3';
  
    export let csvPath = '/fire_climate_data.csv';
  
    let container;
    let tooltip;
    let data = [];
    let aggData = [];
    let currentYearIndex = 0;
    let interval;
    let svg, g, x, y, seasonColor;
  
    const margin = { top: 60, right: 150, bottom: 60, left: 80 };
    const width = 1200, height = 600;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    onMount(async () => {
      data = await d3.csv(csvPath, d => ({
        YEAR: +d.YEAR,
        MONTH: +d.MONTH,
        fire_count: +d.fire_count,
        SEASON: d.SEASON
      }));
  
      const aggMap = d3.rollup(
        data,
        v => ({
          Winter: d3.sum(v.filter(d => d.SEASON === 'Winter'), d => d.fire_count),
          Spring: d3.sum(v.filter(d => d.SEASON === 'Spring'), d => d.fire_count),
          Summer: d3.sum(v.filter(d => d.SEASON === 'Summer'), d => d.fire_count),
          Fall:   d3.sum(v.filter(d => d.SEASON === 'Fall'), d => d.fire_count)
        }),
        d => d.YEAR
      );
  
      aggData = Array.from(aggMap, ([year, seasons]) => ({ YEAR: +year, ...seasons }))
                     .sort((a, b) => a.YEAR - b.YEAR);
  
      initChart();
      drawBand();
  
      interval = d3.interval(() => {
        if (currentYearIndex < aggData.length) {
          drawSegmentedLine(aggData[currentYearIndex], 1.0);
          fadeLine(aggData[currentYearIndex].YEAR);
          currentYearIndex++;
        } else {
          interval.stop();
        }
      }, 1000);
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
        .text("Wildfire Count per Season by Year");
  
      g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
      x = d3.scalePoint()
        .domain(["Winter", "Spring", "Summer", "Fall"])
        .range([0, innerWidth])
        .padding(0.5);
  
      const maxCount = d3.max(aggData, d => Math.max(d.Winter, d.Spring, d.Summer, d.Fall));
      y = d3.scaleLinear()
        .domain([0, maxCount]).nice()
        .range([innerHeight, 0]);
  
      g.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${innerHeight})`).call(d3.axisBottom(x));
      g.append("g").attr("class", "y-axis").call(d3.axisLeft(y));
  
      seasonColor = d3.scaleOrdinal()
        .domain(["Winter", "Spring", "Summer", "Fall"])
        .range(d3.schemeTableau10);
  
      tooltip = d3.select(container)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "#222")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "6px")
        .style("font-size", "14px");
  
      const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
  
      ["Winter", "Spring", "Summer", "Fall"].forEach((season, i) => {
        const row = legend.append("g").attr("transform", `translate(0, ${i * 25})`);
        row.append("rect").attr("width", 18).attr("height", 18).attr("fill", seasonColor(season));
        row.append("text").attr("x", 25).attr("y", 14).style("font-size", "14px").text(season);
      });
    }
  
    function drawSegmentedLine(yearData, initialOpacity = 1.0) {
      const orderedSeasons = ["Winter", "Spring", "Summer", "Fall"];
      const points = orderedSeasons.map(season => ({
        season,
        x: x(season),
        y: y(yearData[season]),
        count: yearData[season]
      }));
  
      const group = g.append("g")
        .attr("class", "year-line-group")
        .attr("opacity", initialOpacity);
  
      for (let i = 0; i < points.length - 1; i++) {
        const season = points[i].season;
        const seg = [points[i], points[i + 1]];
  
        const path = group.append("path")
          .datum(seg)
          .attr("fill", "none")
          .attr("stroke", seasonColor(season))
          .attr("stroke-width", 2)
          .attr("d", d3.line().x(d => d.x).y(d => d.y).curve(d3.curveMonotoneX))
          .on("mouseover", function () {
            d3.select(this).attr("stroke-width", 3);
            tooltip
              .html(`<strong>Year: ${yearData.YEAR}</strong><br>Winter: ${yearData.Winter}<br>Spring: ${yearData.Spring}<br>Summer: ${yearData.Summer}<br>Fall: ${yearData.Fall}`)
              .style("opacity", 1);
          })
          .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 15}px`).style("top", `${event.pageY - 30}px`);
          })
          .on("mouseout", function () {
            d3.select(this).attr("stroke-width", 2);
            tooltip.style("opacity", 0);
          });
  
        const totalLength = path.node().getTotalLength();
        path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition().duration(1000).ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
      }
    }
  
    function fadeLine(year) {
      setTimeout(() => {
        g.selectAll(".year-line-group")
          .transition()
          .duration(1000)
          .attr("opacity", 0.4);
      }, 1200);
    }
  
    function drawBand() {
      const seasons = ["Winter", "Spring", "Summer", "Fall"];
      const bandData = seasons.map(season => {
        const counts = aggData.map(d => d[season]);
        return {
          season,
          min: d3.min(counts),
          max: d3.max(counts)
        };
      });
  
      const areaGenerator = d3.area()
        .x(d => x(d.season))
        .y0(d => y(d.min))
        .y1(d => y(d.max))
        .curve(d3.curveMonotoneX);
  
      g.append("path")
        .datum(bandData)
        .attr("class", "band")
        .attr("fill", "steelblue")
        .attr("opacity", 0)
        .attr("d", areaGenerator)
        .transition()
        .duration(2000)
        .attr("opacity", 0.3);
    }
  
    function showAllLinesNow() {
      if (interval) interval.stop();
      currentYearIndex = aggData.length;
      aggData.forEach(d => drawSegmentedLine(d, 0.4));
    }
  </script>
  
  <!-- Layout -->
  <div style="display: flex; max-width: 1280px; margin: auto; position: relative;">
    <div bind:this={container} style="flex: 1; position: relative;"></div>
    <div style="margin-left: 20px;">
      <button on:click={showAllLinesNow} style="padding: 10px 20px; font-size: 16px;">
        Show All Lines
      </button>
    </div>
  </div>
  
  <style>
    svg {
      font-family: sans-serif;
    }
    .tooltip {
      transition: opacity 0.2s ease-in-out;
    }
    button {
      background-color: #444;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    button:hover {
      background-color: #222;
    }
  </style>
  