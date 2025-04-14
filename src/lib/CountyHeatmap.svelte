<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
  
    export let csvPath = '/corr_heatmap_county.csv';
    export let initialStartYear = 1992;
    export let initialEndYear = 2020;
    export let initialTopN = 10;
  
    let container;
    let rawData = [];
    let heatmapData = [];
  
    let startYear = initialStartYear;
    let endYear = initialEndYear;
    let topN = initialTopN;
  
    let allYears = [];
  
    const cellWidth = 75;
    const cellHeight = 26;
  
    onMount(async () => {
      rawData = await d3.csv(csvPath, d => ({
        county: d.county,
        year: +d.FIRE_YEAR,
        fire_count: +d.fire_count
      }));
  
      allYears = Array.from(new Set(rawData.map(d => d.year))).sort((a, b) => a - b);
      updateHeatmap();
    });
  
    function updateHeatmap() {
      const selectedYears = allYears.filter(y => y >= startYear && y <= endYear);
      const filtered = rawData.filter(d => d.year >= startYear && d.year <= endYear);
  
      const countyTotals = d3.rollups(
        filtered,
        v => d3.sum(v, d => d.fire_count),
        d => d.county
      ).sort((a, b) => b[1] - a[1]);
  
      const topCounties = countyTotals.slice(0, topN).map(d => d[0]);
  
      heatmapData = [];
      selectedYears.forEach(year => {
        topCounties.forEach(county => {
          const match = rawData.find(d => d.county === county && d.year === year);
          heatmapData.push({
            county,
            year,
            fire_count: match ? match.fire_count : 0
          });
        });
      });
  
      draw(topCounties, selectedYears);
    }
  
    function draw(countyOrder, yYears) {
      d3.select(container).selectAll('*').remove();
  
      const margin = { top: 160, right: 20, bottom: 40, left: 80 };
      const width = margin.left + margin.right + cellWidth * countyOrder.length;
      const height = margin.top + margin.bottom + cellHeight * yYears.length;
  
      const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
  
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      const x = d3.scaleBand()
        .domain(countyOrder)
        .range([0, cellWidth * countyOrder.length])
        .padding(0.1);
  
      const y = d3.scaleBand()
        .domain(yYears)
        .range([0, cellHeight * yYears.length]);
  
      const maxCount = d3.max(heatmapData, d => d.fire_count);
      const colorScale = d3.scaleSequential()
        .domain([0, maxCount])
        .interpolator(d3.interpolateReds);
  
      const rects = g.selectAll("rect")
        .data(heatmapData, d => d.county + '-' + d.year);
  
      rects.enter()
        .append("rect")
        .merge(rects)
        .transition()
        .duration(600)
        .attr("x", d => x(d.county))
        .attr("y", d => y(d.year))
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .style("fill", d => colorScale(d.fire_count))
        .style("stroke", "#fff");
  
      rects.exit().remove();
  
      const texts = g.selectAll("text.cell")
        .data(heatmapData, d => d.county + '-' + d.year);
  
      texts.enter()
        .append("text")
        .attr("class", "cell")
        .attr("x", d => x(d.county) + cellWidth / 2)
        .attr("y", d => y(d.year) + cellHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .style("opacity", 0)
        .text(d => d.fire_count > 0 ? d.fire_count : '')
        .transition()
        .duration(600)
        .style("opacity", 1);
  
      texts.transition()
        .duration(600)
        .attr("x", d => x(d.county) + cellWidth / 2)
        .attr("y", d => y(d.year) + cellHeight / 2)
        .text(d => d.fire_count > 0 ? d.fire_count : '');
  
      texts.exit().remove();
  
      svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top - 10})`)
        .selectAll("text")
        .data(countyOrder)
        .enter()
        .append("text")
        .attr("x", d => x(d) + cellWidth / 2)
        .attr("y", 0)
        .attr("text-anchor", "start")
        .attr("transform", d => `rotate(-45, ${x(d) + cellWidth / 2}, 0)`)
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .text(d => d);
  
      svg.append("g")
        .attr("transform", `translate(${margin.left - 10},${margin.top})`)
        .selectAll("text")
        .data(yYears)
        .enter()
        .append("text")
        .attr("x", -5)
        .attr("y", d => y(d) + cellHeight / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "12px")
        .text(d => d);
    }
  </script>
  
  <!-- UI Controls -->
  <div style="text-align: center; margin-bottom: 1rem;">
    <label>Start Year:
      <input type="number" bind:value={startYear} min="1992" max="2020" on:input={updateHeatmap} />
    </label>
    <label style="margin-left: 20px;">End Year:
      <input type="number" bind:value={endYear} min="1992" max="2020" on:input={updateHeatmap} />
    </label>
    <label style="margin-left: 20px;">Top N Counties:
      <input type="number" bind:value={topN} min="1" max="58" on:input={updateHeatmap} />
    </label>
  </div>
  
  <!-- Chart -->
  <div bind:this={container} style="overflow-x: auto; overflow-y: auto; max-width: 100%; max-height: 800px; margin: auto;"></div>
  
  <style>
    svg {
      font-family: 'Segoe UI', sans-serif;
    }
  </style>
  