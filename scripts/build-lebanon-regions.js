/**
 * Dissolve geoBoundaries LBN ADM2 districts into 6 dialect regions.
 * Source: tmp/geoBoundaries-LBN-ADM2.geojson (gbOpen)
 */
const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "tmp", "geoBoundaries-LBN-ADM2.geojson");
const OUT_DIR = path.join(ROOT, "assets", "geojson");
const OUT = path.join(OUT_DIR, "lebanon-regions.geojson");
const REPORT = path.join(ROOT, "tmp", "area-report.json");

const OFFICIAL_KM2 = 10452;

const REGION_MAP = {
    Beirut: { region_id: "beirut", name_ar: "بيروت", name_en: "Beirut" },
    Jbail: { region_id: "mountain", name_ar: "الجبل", name_en: "Mount Lebanon" },
    Kesrouan: { region_id: "mountain", name_ar: "الجبل", name_en: "Mount Lebanon" },
    "El Metn": { region_id: "mountain", name_ar: "الجبل", name_en: "Mount Lebanon" },
    Baabda: { region_id: "mountain", name_ar: "الجبل", name_en: "Mount Lebanon" },
    Aley: { region_id: "mountain", name_ar: "الجبل", name_en: "Mount Lebanon" },
    Chouf: { region_id: "mountain", name_ar: "الجبل", name_en: "Mount Lebanon" },
    Akkar: { region_id: "north", name_ar: "الشمال", name_en: "North" },
    Zgharta: { region_id: "north", name_ar: "الشمال", name_en: "North" },
    Bcharre: { region_id: "north", name_ar: "الشمال", name_en: "North" },
    Koura: { region_id: "north", name_ar: "الشمال", name_en: "North" },
    Batroun: { region_id: "north", name_ar: "الشمال", name_en: "North" },
    Tripoli: { region_id: "north", name_ar: "الشمال", name_en: "North" },
    "Minieh-Dinnieh": { region_id: "north", name_ar: "الشمال", name_en: "North" },
    Zahle: { region_id: "bekaa", name_ar: "البقاع", name_en: "Bekaa" },
    Baalbek: { region_id: "bekaa", name_ar: "البقاع", name_en: "Bekaa" },
    Hermel: { region_id: "bekaa", name_ar: "البقاع", name_en: "Bekaa" },
    "West Bekaa": { region_id: "west-bekaa", name_ar: "البقاع الغربي", name_en: "West Bekaa" },
    Rachaya: { region_id: "west-bekaa", name_ar: "البقاع الغربي", name_en: "West Bekaa" },
    Saida: { region_id: "south", name_ar: "الجنوب", name_en: "South" },
    Sour: { region_id: "south", name_ar: "الجنوب", name_en: "South" },
    Jezzine: { region_id: "south", name_ar: "الجنوب", name_en: "South" },
    Nabatiye: { region_id: "south", name_ar: "الجنوب", name_en: "South" },
    "Bent Jbail": { region_id: "south", name_ar: "الجنوب", name_en: "South" },
    Marjaayoun: { region_id: "south", name_ar: "الجنوب", name_en: "South" },
    Hasbaya: { region_id: "south", name_ar: "الجنوب", name_en: "South" }
};

const ORDER = ["beirut", "mountain", "north", "bekaa", "west-bekaa", "south"];

function unionFeatures(features) {
    if (!features.length) return null;
    let merged = features[0];
    for (let i = 1; i < features.length; i++) {
        try {
            merged = turf.union(turf.featureCollection([merged, features[i]]));
        } catch (err) {
            // fallback: buffer(0) cleanup then retry
            const a = turf.buffer(merged, 0);
            const b = turf.buffer(features[i], 0);
            merged = turf.union(turf.featureCollection([a, b]));
        }
    }
    return merged;
}

const raw = JSON.parse(fs.readFileSync(SRC, "utf8"));
const groups = {};
const unmatched = [];

for (const feature of raw.features) {
    const name = feature.properties.shapeName;
    const meta = REGION_MAP[name];
    if (!meta) {
        unmatched.push(name);
        continue;
    }
    if (!groups[meta.region_id]) {
        groups[meta.region_id] = {
            meta,
            districts: [],
            features: []
        };
    }
    groups[meta.region_id].districts.push(name);
    groups[meta.region_id].features.push(
        turf.feature(feature.geometry, { shapeName: name })
    );
}

if (unmatched.length) {
    throw new Error("Unmapped districts: " + unmatched.join(", "));
}

const outFeatures = [];
const areaRows = [];

for (const id of ORDER) {
    const group = groups[id];
    if (!group) throw new Error("Missing region: " + id);

    const dissolved = unionFeatures(group.features);
    if (!dissolved) throw new Error("Union failed for " + id);

    const areaKm2 = turf.area(dissolved) / 1e6;
    const centroid = turf.centroid(dissolved).geometry.coordinates;

    dissolved.properties = {
        region_id: group.meta.region_id,
        name_ar: group.meta.name_ar,
        name_en: group.meta.name_en,
        area_km2: Math.round(areaKm2 * 100) / 100,
        source_districts: group.districts,
        label_lng: centroid[0],
        label_lat: centroid[1]
    };

    outFeatures.push(dissolved);
    areaRows.push({
        region_id: id,
        name_ar: group.meta.name_ar,
        districts: group.districts,
        area_km2: dissolved.properties.area_km2
    });
}

const totalKm2 =
    Math.round(areaRows.reduce((s, r) => s + r.area_km2, 0) * 100) / 100;

const collection = {
    type: "FeatureCollection",
    properties: {
        country: "Lebanon",
        official_area_km2: OFFICIAL_KM2,
        computed_total_km2: totalKm2,
        delta_km2: Math.round((totalKm2 - OFFICIAL_KM2) * 100) / 100,
        source: "geoBoundaries gbOpen LBN ADM2",
        source_file: "tmp/geoBoundaries-LBN-ADM2.geojson",
        method: "turf.union dissolve of ADM2 polygons into 6 regions"
    },
    features: outFeatures
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(REPORT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(collection));
fs.writeFileSync(
    REPORT,
    JSON.stringify(
        {
            official_km2: OFFICIAL_KM2,
            computed_total_km2: totalKm2,
            delta_km2: collection.properties.delta_km2,
            regions: areaRows
        },
        null,
        2
    )
);

console.log(JSON.stringify({ out: OUT, report: REPORT, totalKm2, regions: areaRows }, null, 2));
