/**
 * Render dissolved regions to SVG (+ optional PNG via @resvg/resvg-js if available).
 */
const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

const ROOT = path.resolve(__dirname, "..");
const GEOJSON = path.join(ROOT, "assets", "geojson", "lebanon-regions.geojson");
const OUT_SVG = path.join(ROOT, "tmp", "lebanon-regions-preview.svg");
const OUT_PNG = path.join(ROOT, "tmp", "lebanon-regions-preview.png");

const COLORS = {
    beirut: "#c1121f",
    mountain: "#2a9d8f",
    north: "#264653",
    bekaa: "#e9c46a",
    "west-bekaa": "#f4a261",
    south: "#1d3557"
};

const WIDTH = 900;
const HEIGHT = 1100;
const PAD = 36;

const geojson = JSON.parse(fs.readFileSync(GEOJSON, "utf8"));
const bbox = turf.bbox(geojson); // [minX, minY, maxX, maxY]

function project([lng, lat]) {
    const x = PAD + ((lng - bbox[0]) / (bbox[2] - bbox[0])) * (WIDTH - PAD * 2);
    // SVG y grows downward; flip latitude
    const y = PAD + ((bbox[3] - lat) / (bbox[3] - bbox[1])) * (HEIGHT - PAD * 2);
    return [x, y];
}

function ringToPath(ring) {
    return ring
        .map((coord, i) => {
            const [x, y] = project(coord);
            return (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2);
        })
        .join(" ") + " Z";
}

function geomToPath(geometry) {
    if (geometry.type === "Polygon") {
        return geometry.coordinates.map(ringToPath).join(" ");
    }
    if (geometry.type === "MultiPolygon") {
        return geometry.coordinates
            .map((poly) => poly.map(ringToPath).join(" "))
            .join(" ");
    }
    return "";
}

const LABEL_OFFSETS = {
    beirut: { lng: -0.008, lat: 0 }
};

const paths = geojson.features
    .map((f) => {
        const id = f.properties.region_id;
        const d = geomToPath(f.geometry);
        const off = LABEL_OFFSETS[id] || { lng: 0, lat: 0 };
        const [lx, ly] = project([
            f.properties.label_lng + off.lng,
            f.properties.label_lat + off.lat
        ]);
        return {
            id,
            d,
            fill: COLORS[id] || "#888",
            name_ar: f.properties.name_ar,
            lx,
            ly,
            area: f.properties.area_km2
        };
    })
    .map(
        (r) => `
  <g class="region" data-id="${r.id}">
    <path d="${r.d}" fill="${r.fill}" fill-opacity="0.78" stroke="#1a1a1a" stroke-width="1.4" stroke-linejoin="round"/>
    <text x="${r.lx.toFixed(1)}" y="${r.ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
      font-family="Tahoma, Arial, sans-serif" font-size="22" font-weight="700" fill="#111"
      stroke="#fff" stroke-width="3" paint-order="stroke">${r.name_ar}</text>
  </g>`
    )
    .join("\n");

const total = geojson.properties.computed_total_km2;
const official = geojson.properties.official_area_km2;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="100%" height="100%" fill="#c5dde8"/>
  <text x="${PAD}" y="28" font-family="Tahoma, Arial, sans-serif" font-size="16" fill="#333">
    Lebanon — geoBoundaries ADM2 dissolved (computed ${total} km² / official ${official} km²)
  </text>
  ${paths}
</svg>
`;

fs.mkdirSync(path.dirname(OUT_SVG), { recursive: true });
fs.writeFileSync(OUT_SVG, svg);
console.log("Wrote", OUT_SVG);

async function maybePng() {
    try {
        const { Resvg } = require("@resvg/resvg-js");
        const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
        const png = resvg.render().asPng();
        fs.writeFileSync(OUT_PNG, png);
        console.log("Wrote", OUT_PNG);
    } catch (err) {
        console.warn("PNG skip (install @resvg/resvg-js to enable):", err.message);
    }
}

maybePng();
