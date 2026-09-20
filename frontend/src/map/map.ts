import maplibregl from "maplibre-gl";

const mapTilerKey = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
export const mapTilerBuildingTiles = mapTilerKey
  ? `https://api.maptiler.com/tiles/v3/tiles.json?key=${mapTilerKey}`
  : undefined;

const mapTilerStyle = (style: string) =>
  `https://api.maptiler.com/maps/${style}/style.json?key=${mapTilerKey}`;

export const BASEMAPS = {
  openstreetmap: {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors"
      }
    },
    layers: [{ id: "osm", type: "raster", source: "osm" }]
  } as maplibregl.StyleSpecification,
  "openstreetmap-3d": "https://tiles.openfreemap.org/styles/liberty",
  ...(mapTilerKey ? {
    "maptiler-streets": mapTilerStyle("streets-v2"),
    "maptiler-outdoor": mapTilerStyle("outdoor-v2"),
    "maptiler-basic": mapTilerStyle("basic-v2"),
    "maptiler-satellite": mapTilerStyle("satellite"),
    "maptiler-topo": mapTilerStyle("topo-v2"),
  } : {})
  ,
  "carto-dark": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  "carto-light": "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  esri: {
    version: 8,
    sources: {
      esri: {
        type: "raster",
        tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        attribution: "Esri World Imagery"
      }
    },
    layers: [{ id: "esri-imagery", type: "raster", source: "esri" }]
  } as maplibregl.StyleSpecification
} as const;

export type BasemapId = keyof typeof BASEMAPS;

export const initializeMap = (
  container: HTMLElement,
  style: string | maplibregl.StyleSpecification = BASEMAPS.openstreetmap,
  center: [number, number] = [37.0111, -1.1027],
  zoom = 16,
  pitch = 0,
  bearing = 0
) => {
  const map = new maplibregl.Map({
    container,
    style,
    center,
    zoom,
    pitch,
    bearing,
    attributionControl: {}
  });
  map.addControl(new maplibregl.NavigationControl(), "top-right");
  return map;
};
