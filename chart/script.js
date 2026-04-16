// script.js
const margin = {top: 40, right: 120, bottom: 40, left: 80},
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#viz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 1. Load Data
d3.json("sea_gdp_cleaned.json").then(data => {

    // 2. Scales
    // X Scale
const x = d3.scaleLinear()
    .domain([
        d3.min(data, c => d3.min(c.values, d => d.x)), // Changed .year to .x
        d3.max(data, c => d3.max(c.values, d => d.x))  // Changed .year to .x
    ])
    .range([0, width]);

// Y Scale
const y = d3.scaleLinear()
    .domain([0, d3.max(data, c => d3.max(c.values, d => d.y))]).nice() // Changed .gdp to .y
    .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // 3. Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format("$.2s")));

    // 4. Line Generator
    const line = d3.line()
    .x(d => x(d.x)) 
    .y(d => y(d.y)) 
    .defined(d => !isNaN(d.y)); 

    // 5. Draw Lines
    const country = svg.selectAll(".country")
        .data(data)
        .enter().append("g")
        .attr("class", "line-group");

    country.append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        .style("stroke", d => color(d.country))
        .style("fill", "none")
        .style("stroke-width", 2);

    // 6. Interactive Tooltip Logic
    const dot = svg.append("g").style("display", "none");
    dot.append("circle").attr("r", 5);
    dot.append("text").attr("font-size", 12).attr("y", -15).attr("text-anchor", "middle");

    // Invisible rect to capture mouse movements
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => dot.style("display", null))
        .on("mouseout", () => dot.style("display", "none"))
        .on("mousemove", (event) => {
            const [xm, ym] = d3.pointer(event);
            const yearMouse = x.invert(xm);
            
            const candidates = data.map(c => {
                const bisect = d3.bisector(d => d.x).center; 
                let i = bisect(c.values, yearMouse);
                
                if (i >= c.values.length) i = c.values.length - 1;
                if (i < 0) i = 0;
                
                const point = c.values[i];
                if (!point) return null; 

                return { country: c.country, ...point };
            }).filter(d => d !== null);

            if (candidates.length > 0) {
                const closest = d3.least(candidates, d => Math.abs(y(d.y) - ym)); 

                if (closest) {
                    dot.attr("transform", `translate(${x(closest.x)},${y(closest.y)})`); 
                    dot.select("text").text(`${closest.country}: ${d3.format("$.3s")(closest.y)}`); 
                    dot.select("circle").attr("fill", color(closest.country));
                }
            }
        }); // closing mousemove

            // 7. Add Legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 0)`); // Position in right margin

        const legendItems = legend.selectAll(".legend-item")
            .data(data)
            .enter().append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`)
            // Optional: Interactive Highlight
            .on("mouseover", (event, d) => {
                svg.selectAll(".line")
                   .classed("faded", l => l.country !== d.country)
                   .classed("highlighted", l => l.country === d.country);
            })
            .on("mouseout", () => {
                svg.selectAll(".line")
                   .classed("faded", false)
                   .classed("highlighted", false);
            });

        // Add colored circles to legend
        legendItems.append("circle")
            .attr("r", 6)
            .attr("fill", d => color(d.country));

        // Add country names to legend
        legendItems.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .text(d => d.country);

}); // closing d3.json.then