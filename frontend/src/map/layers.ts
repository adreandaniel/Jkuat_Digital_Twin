import maplibregl from "maplibre-gl";

export function addGeoJSON(
  map: maplibregl.Map,
  id: string,
  data: GeoJSON.FeatureCollection,
  type: "fill" | "line" | "circle",
  paint: maplibregl.LayerSpecification["paint"] = {}
) {
  if (!map.getSource(id)) {
    map.addSource(id, { type: "geojson", data });
  }
  if (!map.getLayer(id)) {
    map.addLayer({ id, type, source: id, paint } as maplibregl.LayerSpecification);
  }
}

export function setGeoJSON(
  map: maplibregl.Map,
  id: string,
  data: GeoJSON.FeatureCollection
) {
  const source = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
  source?.setData(data);
}
