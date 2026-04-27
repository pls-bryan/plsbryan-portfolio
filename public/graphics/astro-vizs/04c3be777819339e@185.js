function _1(md){return(
md`# Final Project`
)}

async function _astro(FileAttachment){return(
await FileAttachment("astro.csv").csv()
)}

function _astronaut(astro)
{
  const occupationFix = {
  "Pilot":        "pilot",
  "Flight engineer":          "flight engineer",
  "MSP":          "Mission Specialist",
  "PSP": "Payload Specialist",
  "Other (Space tourist)":    "Other (space tourist)",
  "spaceflight participant":    "Other (space tourist)",
  "Space tourist": "Other (space tourist)",
  "spaceflight participant": "Other (space tourist)",
};
  const nationalityFix = {
    "U.K./U.S.":"U.S."
  };
  
  let temp = astro.map(d => ({
  ...d,
  occupation: occupationFix[d.occupation.trim()] ?? d.occupation.trim(),
    nationality: nationalityFix[d.nationality.trim()] ?? d.nationality.trim()
}));
             
  return temp;
}


function _4(astronaut){return(
[...new Set(astronaut.map(d => d.occupation))].sort()
)}

function _artemisAstronauts(){return(
[
    { name:"Reid Wiseman",nationality: "U.S.",occupation: "commander",sex: "male",year_of_selection:"2009" ,military_civilian: "military"},
    { name:"Victor Glover",nationality: "U.S.", occupation: "pilot",sex: "male",year_of_selection:"2013" ,military_civilian: "military"  },
    {name:"Christina Koch",nationality: "U.S.", occupation: "Mission Specialist",sex: "female",year_of_selection:"2013" ,military_civilian: "civilian"},
    {name:"Jeremy Hansen",nationality: "Canada", occupation: "Mission Specialist",sex: "male",year_of_selection:"2009" ,military_civilian: "military"},
  ]
)}

function _6(md){return(
md`# Charts`
)}

function _7(astronaut,d3,artemisAstronauts)
{
    const seenNums = new Set();
    const unique = astronaut.filter(d => {
        if (seenNums.has(d.number)) return false;
        seenNums.add(d.number);
        return true;
    });

    const males = unique.filter(d => d.sex === "male");
    const females = unique.filter(d => d.sex === "female");

    const occupations = [...new Set(unique.map(d => d.occupation))].sort();
    const nationalities = [...new Set(unique.map(d => d.nationality))].sort();

    // COUNT HELPER
    function buildCountMap(subset) {
        const map = new Map();
        for (const nat of nationalities)
            for (const occ of occupations)
                map.set(`${nat}||${occ}`, 0);
        for (const d of subset) {
            const k = `${d.nationality}||${d.occupation}`;
            if (map.has(k)) map.set(k, map.get(k) + 1);
        }
        return map;
    }

    const maleMap = buildCountMap(males);
    const femaleMap = buildCountMap(females);

    const globalMax = d3.max([...maleMap.values(), ...femaleMap.values()]);

    const cellW = 46;
    const cellH = 22;
    const gridW = occupations.length * cellW;
    const gridH = nationalities.length * cellH;

    const mt = 60,
        mb = 120,
        ml = 170,
        mr = 20;
    const facetGap = 90; // horizontal gap between the two grids
    const legendH = 14;
    const legendW = Math.min(200, gridW);
    const totalW = ml + gridW * 2 + facetGap + mr;
    const totalH = mt + gridH + mb;

    const xScale = d3.scaleBand().domain(occupations).range([0, gridW]).padding(0.04);
    const yScale = d3.scaleBand().domain(nationalities).range([0, gridH]).padding(0.04);

    // Sequential blue → purple ramp; zero cells get a distinct light gray
    const colorScale = d3.scaleSequential()
        .domain([1, globalMax])
        .interpolator(d3.interpolateBlues);

    const svg = d3.create("svg")
        .attr("width", totalW)
        .attr("height", totalH)
        .style("font-family", "sans-serif")
        .style("font-size", "11px");

    // Gradient defs for legend
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "hm-grad");
    d3.range(0, 1.01, 0.1).forEach(t => {
        grad.append("stop")
            .attr("offset", `${t * 100}%`)
            .attr("stop-color", colorScale(1 + t * (globalMax - 1)));
    });

    const tooltip = d3.select("body").append("div")
        .style("position", "fixed")
        .style("background", "#222")
        .style("color", "#fff")
        .style("padding", "6px 10px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", "0")
        .style("transition", "opacity 0.15s");

    function drawFacet(parentG, countMap, title, artemisSubset, showYAxis) {

        // Facet title
        parentG.append("text")
            .attr("x", gridW / 2)
            .attr("y", -28)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "600")
            .text(title);

        // cells
        for (const nat of nationalities) {
            for (const occ of occupations) {
                const count = countMap.get(`${nat}||${occ}`) || 0;
                const x = xScale(occ);
                const y = yScale(nat);
                const bw = xScale.bandwidth();
                const bh = yScale.bandwidth();

                parentG.append("rect")
                    .attr("x", x).attr("y", y)
                    .attr("width", bw).attr("height", bh)
                    .attr("rx", 2)
                    .attr("fill", count === 0 ? "#ebebeb" : colorScale(count))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5);

                if (count > 0) {
                    parentG.append("text")
                        .attr("x", x + bw / 2)
                        .attr("y", y + bh / 2 + 4)
                        .attr("text-anchor", "middle")
                        .style("font-size", "10px")
                        .style("fill", count >= globalMax * 0.55 ? "#fff" : "#333")
                        .style("pointer-events", "none")
                        .text(count);
                }

                parentG.select("rect:last-of-type")
                    .append("title")
                    .text(`${nat} / ${occ}\nCount: ${count}`);
            }
        }

        // artemis dots
        for (const a of artemisSubset) {
            const x = xScale(a.occupation);
            const y = yScale(a.nationality);
            if (x === undefined || y === undefined) continue;

            const bw = xScale.bandwidth();
            const bh = yScale.bandwidth();
            const finalR = Math.min(bw, bh) / 2;

            // starting radius (big)
            const startR = finalR * 5;
            const startY = y + bh / 2 - 20;

            const circle = parentG.append("circle")
                .attr("cx", x + bw / 2)
                .attr("cy", startY)
                .attr("r", startR)
                .attr("fill", "none")
                .attr("stroke", "#e07b00")
                .attr("stroke-width", 3)
                .style("cursor", "pointer")
                .on("mouseover", function() {
                    tooltip.style("opacity", "1").text(a.name);
                })
                .on("mousemove", function(event) {
                    tooltip
                        .style("left", (event.clientX + 14) + "px")
                        .style("top", (event.clientY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", "0");
                });

            // animate to final position + radius
            circle.transition()
                .duration(2000)
                .ease(d3.easeBackOut.overshoot(1.7))
                .attr("cy", y + bh / 2)
                .attr("r", finalR);
        }

        // x axis
        const xAxis = parentG.append("g")
            .attr("transform", `translate(0,${gridH})`)
            .call(
                d3.axisBottom(xScale)
                .tickSize(3)
                .tickPadding(5)
            );
        xAxis.select(".domain").remove();
        xAxis.selectAll("text")
            .style("text-anchor", "end")
            .attr("transform", "rotate(-40)")
            .attr("dx", "-0.5em")
            .attr("dy", "0.15em");

        // y axis for left
        if (showYAxis) {
            const yAxis = parentG.append("g")
                .call(
                    d3.axisLeft(yScale)
                    .tickSize(3)
                    .tickPadding(6)
                );
            yAxis.select(".domain").remove();
        }
    }

    const gMale = svg.append("g")
        .attr("transform", `translate(${ml},${mt})`);
    drawFacet(
        gMale,
        maleMap,
        "Male",
        artemisAstronauts.filter(a => a.sex === "male"),
        true // show y-axis
    );

    const gFemale = svg.append("g")
        .attr("transform", `translate(${ml + gridW + facetGap},${mt})`);
    drawFacet(
        gFemale,
        femaleMap,
        "Female",
        artemisAstronauts.filter(a => a.sex === "female"),
        false // no y-axis — shared with left facet
    );

    // x axis
    svg.append("text")
        .attr("x", ml + gridW + facetGap / 2)
        .attr("y", mt + gridH + 105)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#555")
        .text("Occupation");

    // y axis
    svg.append("text")
        .attr("transform", `translate(14, ${mt + gridH / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#555")
        .text("Nationality");

    // COLOR LEGEND
    const legX = ml;
    const legY = mt + gridH + 75;

    svg.append("text")
        .attr("x", legX)
        .attr("y", legY - 5)
        .style("font-size", "10px")
        .style("fill", "#555")
        .text("Count");

    svg.append("rect")
        .attr("x", legX).attr("y", legY)
        .attr("width", legendW).attr("height", legendH)
        .attr("rx", 2)
        .attr("fill", "url(#hm-grad)");

    // zero swatch (gray)
    svg.append("rect")
        .attr("x", legX + legendW + 10).attr("y", legY)
        .attr("width", legendH).attr("height", legendH)
        .attr("rx", 2).attr("fill", "#ebebeb")
        .attr("stroke", "#ccc").attr("stroke-width", 0.5);
    svg.append("text")
        .attr("x", legX + legendW + 10 + legendH + 4)
        .attr("y", legY + legendH - 2)
        .style("font-size", "10px")
        .style("fill", "#555")
        .text("0");

    svg.append("text")
        .attr("x", legX)
        .attr("y", legY + legendH + 12)
        .style("font-size", "10px")
        .style("fill", "#555")
        .text("1");

    svg.append("text")
        .attr("x", legX + legendW)
        .attr("y", legY + legendH + 12)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#555")
        .text(globalMax);

    const artLegX = legX + legendW + 70;
    const artLegY = legY + legendH / 2;

    svg.append("circle")
        .attr("cx", artLegX).attr("cy", artLegY)
        .attr("r", 5)
        .attr("fill", "none")
        .attr("stroke", "#e07b00")
        .attr("stroke-width", 2);

    svg.append("text")
        .attr("x", artLegX + 10)
        .attr("y", artLegY + 4)
        .style("font-size", "10px")
        .style("fill", "#555")
        .text("Artemis astronaut");

    return svg.node();
}


function _8(d3,astronaut,artemisAstronauts)
{
    const width = 960;
    const height = 700;
    const margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    };
    const nodeWidth = 18;
    const nodePadding = 8;
    const stages = ["military_civilian", "occupation", "sex", "nationality"];
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const byNumber = new Map();
    astronaut.forEach(d => {
        const key = d.number ?? d.id ?? d.name;
        if (!byNumber.has(key)) byNumber.set(key, d);
    });
    const unique = Array.from(byNumber.values());

    const linkCounts = new Map(); // key: `${stageIndex}|${from}|${to}` -> count
    unique.forEach(d => {
        const path = stages.map(s => (d[s] == null ? "Unknown" : String(d[s]).trim() || "Unknown"));
        for (let i = 0; i < path.length - 1; ++i) {
            const key = `${i}|${path[i]}|${path[i + 1]}`;
            linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
        }
    });

    const nodeIndex = new Map();
    const nodes = [];
    const links = [];

    function ensureNode(stageIndex, name) {
        const key = `${stageIndex}|${name}`;
        if (!nodeIndex.has(key)) {
            const idx = nodes.length;
            nodeIndex.set(key, idx);
            nodes.push({
                name,
                stage: stageIndex
            });
        }
        return nodeIndex.get(key);
    }

    // Create nodes for all values that appear in links
    for (const key of linkCounts.keys()) {
        const [iStr, from, to] = key.split("|");
        const i = +iStr;
        ensureNode(i, from);
        ensureNode(i + 1, to);
    }

    // Create links with values
    for (const [key, value] of linkCounts.entries()) {
        const [iStr, from, to] = key.split("|");
        const i = +iStr;
        links.push({
            source: ensureNode(i, from),
            target: ensureNode(i + 1, to),
            value
        });
    }

    const sankeyGen = d3.sankey()
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .extent([
            [margin.left, margin.top],
            [width - margin.right, height - margin.bottom]
        ])
        .nodeId((d, i) => i); // nodes are referenced by index

    const graph = sankeyGen({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .style("font", "12px sans-serif");

    // Define defs for arrowheads
    svg.append("defs").selectAll("marker")
        .data(["overlay"])
        .join("marker")
        .attr("id", d => d)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 10)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#444");

    // Draw links (base flows)
    const link = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => {
            // color by source stage value
            const src = nodes[d.source.index];
            return color(src.name);
        })
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("stroke-linecap", "none")
        .attr("opacity", 0.6);

    // Link tooltip (counts)
    link.append("title")
        .text(d => `${nodes[d.source.index].name} → ${nodes[d.target.index].name}\n${d.value} astronaut(s)`);

    const node = svg.append("g")
        .selectAll("g")
        .data(graph.nodes)
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("rect")
        .attr("height", d => Math.max(1, d.y1 - d.y0))
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => color(d.name))
        .attr("stroke", "#000")
        .attr("stroke-width", 0.2)
        .append("title")
        .text(d => `${d.name}\n${Math.round(d.value)} astronaut(s)`);

    // Node labels
    node.append("text")
        .attr("x", d => d.x0 < width / 2 ? d.x1 - d.x0 + 6 : -6)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
        .text(d => `${d.name} (${Math.round(d.value)})`)
        .style("font-size", 11)
        .style("pointer-events", "none");

    // ARTEMIS OVERLAY
    function findNodeIndex(stageIndex, value) {
        const key = `${stageIndex}|${value}`;
        if (nodeIndex.has(key)) return nodeIndex.get(key);
        const altKey = `${stageIndex}|${String(value).trim() || "Unknown"}`;
        return nodeIndex.get(altKey);
    }

    const overlayG = svg.append("g").attr("class", "artemis-overlay");
    const drawDuration = 3000; // ms for the path draw
    const dotDuration = 2000; // ms for the moving dot (should be <= drawDuration)
    const stagger = 300; // ms stagger between multiple astronaut animations
    const dotRadius = 4;

    function nodeCenter(idx) {
        const n = graph.nodes[idx];
        return [(n.x0 + n.x1) / 2, (n.y0 + n.y1) / 2];
    }

    const tooltip = d3.select(document.body).append("div")
        .attr("class", "sankey-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("padding", "6px 8px")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "#fff")
        .style("font-size", "12px")
        .style("border-radius", "4px")
        .style("display", "none");

    // For each artemis astronaut, create a thin path that follows the sankey link centers
    artemisAstronauts.forEach((a, i) => {
        const seq = stages.map((s, idx) => {
            const val = a[s] ?? a[s.toLowerCase()] ?? "Unknown";
            return findNodeIndex(idx, val);
        });

        if (seq.some(idx => typeof idx === "undefined")) return;

        const points = seq.map(idx => nodeCenter(idx));
        const line = d3.line().curve(d3.curveMonotoneX).x(d => d[0]).y(d => d[1]);
        const pathData = line(points);

        const pathColor = d3.schemeTableau10[i % d3.schemeTableau10.length] || "#222";

        const p = overlayG.append("path")
            .attr("d", pathData)
            .attr("fill", "none")
            .attr("stroke", "#34c9eb")
            .attr("stroke-width", 4)
            .attr("opacity", 0.7)
            .attr("class", "artemis-path")
            .style("pointer-events", "stroke")
            .on("mouseover", (event) => {
                tooltip.style("display", "block").text(a.name || "Artemis astronaut");
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        requestAnimationFrame(() => {
            const total = p.node().getTotalLength();
            p.attr("stroke-dasharray", total)
                .attr("stroke-dashoffset", total);

            // animate dashoffset from total -> 0 once
            p.transition()
                .delay(i * stagger)
                .duration(drawDuration)
                .ease(d3.easeCubicOut)
                .attr("stroke-dashoffset", 0);

            const dot = overlayG.append("circle")
                .attr("r", dotRadius)
                .attr("fill", color)
                .attr("opacity", 0.95)
                .style("pointer-events", "none");

            // attrTween to move the dot along the path
            dot.transition()
                .delay(i * stagger)
                .duration(dotDuration)
                .ease(d3.easeLinear)
                .tween("pathTween", function() {
                    return function(t) {
                        const pt = p.node().getPointAtLength(t * total);
                        dot.attr("cx", pt.x).attr("cy", pt.y);
                    };
                })
                .on("end", () => {
                    dot.transition().duration(400).attr("opacity", 0.0).remove();
                });
            overlayG.selectAll(null)
                .data(points)
                .join("circle")
                .attr("cx", d => d[0])
                .attr("cy", d => d[1])
                .attr("r", 2)
                .attr("fill", "#222")
                .attr("opacity", 0.9)
                .attr("pointer-events", "none");
        });

    });

    return svg.node();
}


function _9(md){return(
md`# Imports`
)}

function _d3(require){return(
require("d3@7", "d3-sankey@0.12")
)}

function _Inputs(require){return(
require("@observablehq/inputs@0.7.8/dist/inputs.umd.min.js")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["astro.csv", {url: new URL("./files/928c412ab4df44841ae69f2f3791c0322d01f19a218c549122363ee5b1dc9c54bdb9032cfa8185808e597878fe519b39fdf771d5ee81b33a85ffc6dabb9031b4.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("astro")).define("astro", ["FileAttachment"], _astro);
  main.variable(observer("astronaut")).define("astronaut", ["astro"], _astronaut);
  main.variable(observer()).define(["astronaut"], _4);
  main.variable(observer("artemisAstronauts")).define("artemisAstronauts", _artemisAstronauts);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer()).define(["astronaut","d3","artemisAstronauts"], _7);
  main.variable(observer()).define(["d3","astronaut","artemisAstronauts"], _8);
  main.variable(observer()).define(["md"], _9);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("Inputs")).define("Inputs", ["require"], _Inputs);
  return main;
}
