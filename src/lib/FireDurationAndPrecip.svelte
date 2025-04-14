<script>
    //@ts-nocheck
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    
    let container;
    let data = [];
    let yearRange = { min: 2013, max: 2020 };
    
    // Set a narrower width to match the other charts
    const chartMaxWidth = 600; // Reduced from 800px
    const chartHeight = 400; // Slightly reduced from 500px
    
    onMount(async () => {
      try {
        const response = await fetch('./California_Fire_Incidents_with_precip_2013-2020.csv');
        const text = await response.text();
        data = d3.csvParse(text, d3.autoType);
        
        // Extract the year from Started or Started_naive if available
        data.forEach(d => {
          if (d.Started) {
            d.Year = new Date(d.Started).getFullYear();
          } else if (d.Started_naive) {
            d.Year = new Date(d.Started_naive).getFullYear();
          } else if (d.fire_year) {
            d.Year = d.fire_year;
          }
        });
        
        if (container) drawScatterPlot();
      } catch (error) {
        console.error("Error loading data:", error);
        d3.select(container)
          .append("div")
          .style("color", "red")
          .style("font-family", "sans-serif")
          .text("Error loading data: " + error.message);
      }
    });
    
    // Reactive statement to draw the scatter plot when data loads
    $: if (data.length > 0 && container) {
      drawScatterPlot();
    }
    
    function drawScatterPlot() {
      const margin = { top: 50, right: 40, bottom: 60, left: 70 };
      const width = chartMaxWidth - margin.left - margin.right;
      const height = chartHeight - margin.top - margin.bottom;
      
      d3.select(container).selectAll("svg").remove(); // Clear old svg
      d3.select(container).selectAll(".tooltip").remove(); // Also clear old tooltips
      
      const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Use all data
      let filteredData = data;
      
      // Filter data with valid average_precip_norm and duration fields
      const cleanData = filteredData.filter(d => 
        d.average_precip_norm != null && 
        d.duration != null && 
        !isNaN(d.average_precip_norm) && 
        !isNaN(d.duration)
      );
      
      if (cleanData.length === 0) {
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .style("font-family", "sans-serif")
          .style("font-size", "16px")
          .text("No valid data found");
        return;
      }
      
      // Create X scale for precipitation
      const x = d3.scaleLinear()
        .domain([0, 100]) // Normalize is 0-100
        .range([0, width]);
      
      // Add X axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");
      
      // Add X axis label
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 15)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "13px") // Reduced font size slightly
        .text("Normalized Precipitation (0-100)");
      
      // Find max duration for Y scale with some padding
      const maxDuration = d3.max(cleanData, d => d.duration) * 1.1;
      
      // Create Y scale for duration
      const y = d3.scaleLinear()
        .domain([0, maxDuration]).nice()
        .range([height, 0]);
      
      // Add Y axis
      svg.append("g")
        .call(d3.axisLeft(y))
        .style("font-size", "12px");
      
      // Add Y axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "13px") // Reduced font size slightly
        .text("Fire Duration (days)");
      
      // Add title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "16px") // Reduced from 18px
        .style("font-weight", "bold")
        .text(`Fire Duration vs. Precipitation (2013-2020)`);
      
      // Create color scale based on precip_bucket
      const colorScale = d3.scaleOrdinal()
        .domain(["LOW", "MEDIUM", "HIGH"])
        .range(["#ff6b6b", "#4dabf7", "#51cf66"]);
      
      // Create tooltip
      const tooltip = d3.select(container)
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("pointer-events", "none")
        .style("z-index", "100");
      
      // Draw scatter points
      svg.selectAll("circle")
        .data(cleanData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.average_precip_norm))
        .attr("cy", d => y(d.duration))
        .attr("r", 4) // Reduced from 5
        .attr("fill", d => colorScale(d.precip_bucket_qcut))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 0.7)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("r", 7) // Reduced from 8
            .attr("opacity", 1);
          
          tooltip.style("opacity", 0.9);
        })
        .on("mousemove", function(event, d) {
          tooltip.html(
            `<strong>${d.Name || "Unnamed Fire"}</strong><br>
            <hr style="margin: 4px 0">
            <span style="font-weight: bold">Year:</span> ${d.Year}<br>
            <span style="font-weight: bold">Duration:</span> ${d.duration.toFixed(1)} days<br>
            <span style="font-weight: bold">Precip Level:</span> ${d.precip_bucket_qcut || "N/A"}<br>
            <span style="font-weight: bold">Normalized Precip:</span> ${d.average_precip_norm.toFixed(1)}<br>
            ${d.AcresBurned ? `<span style="font-weight: bold">Acres Burned:</span> ${d.AcresBurned.toLocaleString()}<br>` : ""}
            ${d.StructuresDestroyed ? `<span style="font-weight: bold">Structures Destroyed:</span> ${d.StructuresDestroyed}<br>` : ""}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("r", 4) // Reduced from 5
            .attr("opacity", 0.7);
          
          tooltip.style("opacity", 0);
        });
      
      // Add legend for precipitation buckets
      const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, 0)`); // Moved slightly to fit in narrower chart
      
      const buckets = ["LOW", "MEDIUM", "HIGH"];
      
      buckets.forEach((bucket, i) => {
        const legendRow = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);
        
        legendRow.append("circle")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", 4) // Reduced from 5
          .attr("fill", colorScale(bucket))
          .attr("stroke", "black")
          .attr("stroke-width", 1);
        
        legendRow.append("text")
          .attr("x", 10)
          .attr("y", 4) // Adjusted
          .style("font-family", "sans-serif")
          .style("font-size", "11px") // Reduced from 12px
          .text(`${bucket} Precip`);
      });
      
      // Add count text in the bottom right
      svg.append("text")
        .attr("x", width)
        .attr("y", height + 40)
        .attr("text-anchor", "end")
        .style("font-family", "sans-serif")
        .style("font-size", "11px") // Reduced from 12px
        .style("font-style", "italic")
        .text(`Total fires: ${cleanData.length}`);
    }
  </script>
  
  <style>
    .chart-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .tooltip {
      font-family: sans-serif;
      font-size: 12px;
      border-radius: 4px;
      box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
    }
  </style>
  
  <div class="chart-container">
    <div bind:this={container} style="width: 100%; max-width: 600px;"></div>
  </div>