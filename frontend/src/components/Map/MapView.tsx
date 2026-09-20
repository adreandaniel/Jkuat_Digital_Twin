import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { BASEMAPS, mapTilerBuildingTiles, type BasemapId, initializeMap } from "../../map/map";
import { addGeoJSON, setGeoJSON } from "../../map/layers";
import { elevationUrl, getElevationBounds, getHillshadeBounds, getLayer, hillshadeUrl } from "../../services/terrain";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  flood?: GeoJSON.FeatureCollection | null;
  basemap?: BasemapId;
  showBasemap?: boolean;
  threeDShowcase?: boolean;
  showHillshade?: boolean;
  showElevation?: boolean;
  showWards?: boolean;
  showStreams?: boolean;
  showBuildings?: boolean;
  showFlow?: boolean;
  onCoordinateChange?: (coordinate: string) => void;
  onStatusChange?: (status: string) => void;
}

export function MapView({
  flood = null,
  basemap,
  showBasemap = true,
  threeDShowcase = false,
  showHillshade = false,
  showElevation = false,
  showWards,
  showStreams,
  showBuildings,
  showFlow,
  onCoordinateChange,
  onStatusChange
}: Props) {
  const basemapLabels: Partial<Record<BasemapId, string>> = {
    openstreetmap: "OpenStreetMap",
    "maptiler-streets": "MapTiler Streets",
    "maptiler-outdoor": "MapTiler Outdoor",
    "maptiler-basic": "MapTiler Basic",
    "maptiler-satellite": "MapTiler Satellite",
    "maptiler-topo": "MapTiler Topo",
    "carto-dark": "Dark Matter",
    "carto-light": "Positron",
    esri: "Esri Imagery"
    , "openstreetmap-3d": "OpenStreetMap 3D"
  };
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const floodRef = useRef(flood);
  const layerState = useRef({ showBasemap, showWards, showStreams, showBuildings, showFlow, showHillshade, showElevation });
  const [panelVisible, setPanelVisible] = useState(!threeDShowcase);
  const elevationCoordinates = useRef<[[number, number], [number, number], [number, number], [number, number]] | null>(null);
  const selectedBasemap = basemap ?? (threeDShowcase ? "openstreetmap-3d" : "openstreetmap");
  const wardsVisible = showWards ?? true;
  const streamsVisible = showStreams ?? true;
  const buildingsVisible = showBuildings ?? true;
  const flowVisible = showFlow ?? false;

  floodRef.current = flood;
  layerState.current = { showBasemap, showWards: wardsVisible, showStreams: streamsVisible, showBuildings: buildingsVisible, showFlow: flowVisible, showHillshade, showElevation };

  const addBuildings = (map: maplibregl.Map) => {
    const buildingTiles = mapTilerBuildingTiles;
    const hasOpenMapTiles = Boolean(map.getSource("openmaptiles"));
    if (!buildingTiles && !hasOpenMapTiles) return;
    if (buildingTiles && !map.getSource("campus-buildings")) {
      map.addSource("campus-buildings", {
        type: "vector",
        url: buildingTiles
      });
    }
    if (threeDShowcase && buildingTiles && !map.getSource("openmaptiles")) {
      map.addSource("openmaptiles", { type: "vector", url: mapTilerBuildingTiles });
      const addContextLayer = (layer: maplibregl.LayerSpecification) => {
        if (!map.getLayer(layer.id)) map.addLayer(layer);
      };
      addContextLayer({ id: "showcase-water", type: "fill", source: "openmaptiles", "source-layer": "water", paint: { "fill-color": "#00a8e8", "fill-opacity": 0.5 } });
      addContextLayer({ id: "showcase-vegetation", type: "fill", source: "openmaptiles", "source-layer": "landcover", filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "farmland", "scrub"]]], paint: { "fill-color": "#22c55e", "fill-opacity": 0.2 } });
      addContextLayer({ id: "showcase-roads", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 12, filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "trunk", "motorway", "minor"]]], paint: { "line-color": "#ff8c00", "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1.2, 17, 5], "line-opacity": 0.78 } });
      addContextLayer({ id: "showcase-footpaths", type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom: 14, filter: ["in", ["get", "class"], ["literal", ["path", "track", "service", "pedestrian"]]], paint: { "line-color": "#b45309", "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.6, 18, 2.4], "line-opacity": 0.72 } });
    }
    const layerId = threeDShowcase ? "campus-buildings-3d" : "campus-buildings";
    const sourceId = hasOpenMapTiles && !buildingTiles ? "openmaptiles" : "campus-buildings";
    if (!map.getLayer(layerId)) {
      if (threeDShowcase) {
        map.addLayer({
          id: layerId,
          type: "fill-extrusion",
          source: sourceId,
          "source-layer": "building",
          minzoom: 15,
          paint: {
            "fill-extrusion-color": [
              "case",
              ["boolean", ["feature-state", "affected"], false], "#e06a58",
              "#6d8791"
            ],
            "fill-extrusion-height": [
              "interpolate", ["linear"], ["zoom"], 14, 0,
              16, ["min", ["coalesce", ["get", "render_height"], 6], 12]
            ],
            "fill-extrusion-base": [
              "interpolate", ["linear"], ["zoom"],
              15, 0,
              16, ["coalesce", ["get", "render_min_height"], 0]
            ],
            "fill-extrusion-opacity": 0.84,
            "fill-extrusion-vertical-gradient": true
          }
        });
        return;
      }
      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-color": [
            "case", ["boolean", ["feature-state", "affected"], false], "#d9473f",
            "#6d8791"
          ],
          "fill-opacity": 0.68,
          "fill-outline-color": "#c8d6d8"
        }
      });
    }
  };

  const markAtRiskBuildings = (map: maplibregl.Map, scenario: GeoJSON.FeatureCollection | null) => {
    const layerId = threeDShowcase ? "campus-buildings-3d" : "campus-buildings";
    if (!scenario || !map.getLayer(layerId)) return;
    const floodFeatures = scenario.features.filter(feature => feature.geometry);
    const buildings = map.queryRenderedFeatures(undefined, { layers: [layerId] });
    buildings.forEach(building => {
      if (building.id === undefined || !building.geometry) return;
      const coordinates = "coordinates" in building.geometry ? building.geometry.coordinates : [];
      const vertices: [number, number][] = [];
      const collect = (value: unknown): void => {
        if (!Array.isArray(value)) return;
        if (typeof value[0] === "number" && typeof value[1] === "number") {
          vertices.push([value[0], value[1]]);
          return;
        }
        value.forEach(collect);
      };
      collect(coordinates);
      if (!vertices.length) return;
      const center = vertices.reduce(([lng, lat], [nextLng, nextLat]) => [lng + nextLng, lat + nextLat], [0, 0]);
      const buildingPoint = point([center[0] / vertices.length, center[1] / vertices.length]);
      const affected = floodFeatures.some(feature =>
        feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon"
          ? booleanPointInPolygon(buildingPoint, feature as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)
          : false
      );
      map.setFeatureState({ source: "campus-buildings", sourceLayer: "building", id: building.id }, { affected });
    });
  };

  const loadLayers = async (map: maplibregl.Map) => {
    onStatusChange?.("Loading spatial layers");
    try {
      try {
        const wards = await getLayer("juja_wards");
        addGeoJSON(map, "wards", wards, "line", {
          "line-color": "#6f351f", "line-width": 2.2, "line-opacity": 0.9
        });
      } catch (e) { console.warn("Ward layer unavailable", e); }

      try {
        const streams = await getLayer("juja_streams");
        addGeoJSON(map, "streams", streams, "line", {
          "line-color": "#19b5d1", "line-width": 2.2, "line-opacity": 0.92
        });
        addGeoJSON(map, "flow-streams", streams, "line", {
          "line-color": "#8be9ff", "line-width": 2.8, "line-opacity": 0.9,
          "line-dasharray": [2, 1]
        });
      } catch (e) { console.warn("Stream layer unavailable", e); }

      addBuildings(map);

      if (!threeDShowcase && !map.getSource("terrain-image")) {
        const coordinates = await getElevationBounds();
        elevationCoordinates.current = coordinates;
        map.addSource("terrain-image", { type: "image", url: elevationUrl(), coordinates });
        map.addLayer({ id: "terrain-elevation", type: "raster", source: "terrain-image", paint: { "raster-opacity": 0.82, "raster-saturation": 0.22 } });
      }
      if (!map.getSource("hillshade-image")) {
        const coordinates = await getHillshadeBounds();
        map.addSource("hillshade-image", { type: "image", url: hillshadeUrl, coordinates });
        map.addLayer({ id: "hillshade-raster", type: "raster", source: "hillshade-image", paint: { "raster-opacity": 0.86, "raster-contrast": 0.52, "raster-brightness-min": 0.08, "raster-brightness-max": 0.92, "raster-resampling": "nearest" } });
      }
      if (map.getLayer("terrain-elevation") && map.getLayer("streams")) map.moveLayer("terrain-elevation", "streams");
      if (map.getLayer("hillshade-raster") && map.getLayer("streams")) map.moveLayer("hillshade-raster", "streams");

      if (map.getLayer("campus-buildings-3d")) map.moveLayer("campus-buildings-3d");

      if (floodRef.current) {
        addGeoJSON(map, "flood", floodRef.current, "fill", {
          "fill-color": "#ff6b35",
          "fill-opacity": 0.42,
          "fill-outline-color": "#ffb347"
        });
      }
      markAtRiskBuildings(map, floodRef.current);
      applyVisibility(map);
      onStatusChange?.("Ready");
    } catch (e) {
      console.error("Layer loading failed", e);
      onStatusChange?.("Basemap ready");
    }
  };

  const applyVisibility = (map: maplibregl.Map) => {
    const state = layerState.current;
    if (map.getLayer("hillshade-raster")) {
      map.setPaintProperty("hillshade-raster", "raster-opacity", state.showElevation ? 0.24 : 0.78);
    }
    [["wards", state.showWards], ["streams", state.showStreams], ["flow-streams", state.showFlow], ["terrain-elevation", state.showElevation], ["hillshade-raster", state.showHillshade], [threeDShowcase ? "campus-buildings-3d" : "campus-buildings", state.showBuildings]]
      .forEach(([id, visible]) => {
        if (map.getLayer(id as string)) {
          map.setLayoutProperty(id as string, "visibility", visible ? "visible" : "none");
        }
      });
    map.getStyle().layers.forEach(layer => {
      if (!["wards", "streams", "flow-streams", "terrain-elevation", "hillshade-raster", "campus-buildings", "campus-buildings-3d", "flood", "terrain-hillshade"].includes(layer.id) && !("source" in layer && layer.source === "openmaptiles")) {
        map.setLayoutProperty(layer.id, "visibility", state.showBasemap ? "visible" : "none");
      }
    });
  };

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = initializeMap(ref.current, undefined, undefined, undefined, threeDShowcase ? 18 : 0, 0);
    mapRef.current = map;

    map.on("load", () => {
      if (threeDShowcase) {
        map.jumpTo({ center: [37.0111, -1.1027], zoom: 15.1, pitch: 18, bearing: 0 });
      }
      void loadLayers(map);
    });
    map.on("style.load", () => void loadLayers(map));
    map.on("mousemove", (event) => {
      onCoordinateChange?.(`${event.lngLat.lat.toFixed(5)}°, ${event.lngLat.lng.toFixed(5)}°`);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded()) applyVisibility(map);
  }, [showBasemap, wardsVisible, streamsVisible, flowVisible, buildingsVisible, showHillshade, showElevation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    let frame = 0;
    const animateFlow = () => {
      if (map.getLayer("flow-streams")) {
        map.setPaintProperty("flow-streams", "line-dasharray", frame % 2 ? [1, 2] : [2, 1]);
      }
      frame += 1;
    };
    const timer = flowVisible ? window.setInterval(animateFlow, 480) : undefined;
    if (!flowVisible && map.getLayer("flow-streams")) map.setPaintProperty("flow-streams", "line-dasharray", [2, 1]);
    return () => { if (timer) window.clearInterval(timer); };
  }, [flowVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    onStatusChange?.("Changing basemap");
    map.setStyle(BASEMAPS[selectedBasemap] ?? BASEMAPS.openstreetmap);
  }, [selectedBasemap]);

  useEffect(() => {
    if (!mapRef.current || !flood || !mapRef.current.isStyleLoaded()) return;
    const map = mapRef.current;
    if (map.isStyleLoaded()) {
      if (!map.getSource("flood")) {
        addGeoJSON(map, "flood", flood, "fill", {
          "fill-color": "#d73027",
          "fill-opacity": 0.45,
          "fill-outline-color": "#b2182b"
        });
      } else {
        setGeoJSON(map, "flood", flood);
      }
      markAtRiskBuildings(map, flood);
    }
  }, [flood]);

  return <div className="map-shell">
    <div ref={ref} className="map-canvas" />
    <button className="map-panel-toggle" onClick={() => setPanelVisible(value => !value)} title="Toggle map controls">
      {panelVisible ? "‹" : "›"}
    </button>
    <div className="map-tools" aria-label="Map controls">
      <button onClick={() => mapRef.current?.zoomIn()} title="Zoom in">+</button>
      <button onClick={() => mapRef.current?.zoomOut()} title="Zoom out">−</button>
      <button onClick={() => mapRef.current?.resetNorthPitch()} title="Reset north">N</button>
    </div>
    <div className={`map-control-rail ${panelVisible ? "" : "is-hidden"}`}>
      <div className="rail-title">MAP VIEW</div>
      <label className="toggle-row"><span><i className="layer-swatch ward" />Wards</span><input type="checkbox" checked={wardsVisible} onChange={event => window.dispatchEvent(new CustomEvent("map:wards", { detail: event.target.checked }))} /></label>
      <label className="toggle-row"><span><i className="layer-swatch stream" />Streams</span><input type="checkbox" checked={streamsVisible} onChange={event => window.dispatchEvent(new CustomEvent("map:streams", { detail: event.target.checked }))} /></label>
      <label className="toggle-row"><span><i className="layer-swatch flow" />Flow streams</span><input type="checkbox" checked={flowVisible} onChange={event => window.dispatchEvent(new CustomEvent("map:flow", { detail: event.target.checked }))} /></label>
      <label className="toggle-row"><span><i className="layer-swatch terrain hillshade-swatch" />QGIS hillshade</span><input type="checkbox" checked={showHillshade} onChange={event => window.dispatchEvent(new CustomEvent("map:hillshade", { detail: event.target.checked }))} /></label>
      <label className="toggle-row"><span>Basemap</span><input type="checkbox" checked={showBasemap} onChange={event => window.dispatchEvent(new CustomEvent("map:basemap-visibility", { detail: event.target.checked }))} /></label>
      <div className="rail-title basemap-title">BASEMAP</div>
      <div className="basemap-grid">
        {(Object.keys(BASEMAPS) as BasemapId[]).map(id => (
          <button className={selectedBasemap === id ? "active" : ""} key={id} onClick={() => window.dispatchEvent(new CustomEvent("map:basemap", { detail: id }))}>{basemapLabels[id] ?? id}</button>
        ))}
      </div>
      <div className="rail-note">{threeDShowcase ? "3D showcase: imagery, terrain relief, and building height are combined for spatial context." : "Terrain colors show relative elevation; hillshade shows local relief and drainage form."}</div>
    </div>
  </div>;
}
