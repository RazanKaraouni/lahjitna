/**
 * Fetch OSM city/town/village points for Lebanon and tag region_id.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const turf = require("@turf/turf");

const ROOT = path.resolve(__dirname, "..");
const REGIONS = path.join(ROOT, "assets", "geojson", "lebanon-regions.geojson");
const OUT = path.join(ROOT, "assets", "geojson", "lebanon-places.geojson");

const OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
];

const QUERY = `
[out:json][timeout:180];
area["ISO3166-1"="LB"][admin_level=2]->.lb;
(
  node["place"="city"](area.lb);
  node["place"="town"](area.lb);
  node["place"="village"](area.lb);
);
out body;
`.trim();

function postOverpass(url, body) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const req = https.request(
            {
                hostname: u.hostname,
                path: u.pathname,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": Buffer.byteLength(body),
                    "User-Agent": "LahjetnaMapBuilder/1.0"
                },
                timeout: 200000
            },
            (res) => {
                let data = "";
                res.on("data", (c) => (data += c));
                res.on("end", () => {
                    if (res.statusCode >= 400) {
                        reject(new Error(url + " HTTP " + res.statusCode + " " + data.slice(0, 200)));
                        return;
                    }
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        );
        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("timeout " + url));
        });
        req.write(body);
        req.end();
    });
}

async function fetchPlaces() {
    const body = "data=" + encodeURIComponent(QUERY);
    let lastErr;
    for (const url of OVERPASS_URLS) {
        try {
            console.log("Trying", url);
            return await postOverpass(url, body);
        } catch (err) {
            lastErr = err;
            console.warn(err.message);
        }
    }
    throw lastErr;
}

function sanitizeLabel(value) {
    if (value == null) return "";
    return String(value)
        .replace(/<[^>]*>/g, "")
        .replace(/[<>"'`]/g, "")
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
        .slice(0, 200);
}

function findRegion(point, regions) {
    for (const region of regions.features) {
        if (turf.booleanPointInPolygon(point, region)) {
            return region.properties;
        }
    }
    return null;
}

(async () => {
    const regions = JSON.parse(fs.readFileSync(REGIONS, "utf8"));
    const osm = await fetchPlaces();
    const elements = osm.elements || [];

    const features = [];
    let skipped = 0;

    for (const el of elements) {
        if (el.type !== "node" || el.lon == null || el.lat == null) continue;
        const tags = el.tags || {};
        const placeType = tags.place;
        if (!["city", "town", "village"].includes(placeType)) continue;

        const nameAr = sanitizeLabel(tags["name:ar"] || tags.name || tags["name:en"]);
        if (!nameAr) {
            skipped++;
            continue;
        }

        const point = turf.point([el.lon, el.lat]);
        const region = findRegion(point, regions);
        if (!region) {
            skipped++;
            continue;
        }

        features.push(
            turf.point([el.lon, el.lat], {
                name_ar: nameAr,
                name_en: sanitizeLabel(tags["name:en"] || tags.name) || null,
                region_id: region.region_id,
                region_ar: region.name_ar,
                population: tags.population ? Number(tags.population) || null : null,
                place_type: placeType,
                osm_id: el.id
            })
        );
    }

    // Prefer Arabic-looking names; keep all that have name_ar field
    const collection = {
        type: "FeatureCollection",
        properties: {
            source: "OpenStreetMap Overpass place=city|town|village",
            country: "Lebanon",
            count: features.length
        },
        features
    };

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(collection));

    const counts = features.reduce((a, f) => {
        a[f.properties.place_type] = (a[f.properties.place_type] || 0) + 1;
        return a;
    }, {});

    console.log(JSON.stringify({ out: OUT, total: features.length, skipped, counts }, null, 2));
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
