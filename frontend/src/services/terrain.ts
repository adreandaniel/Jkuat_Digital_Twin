import { apiClient, API_BASE_URL } from "./api";
import type { TerrainSummary } from "../types";

export const getTerrainSummary = async () =>
  (await apiClient.get<TerrainSummary>("/terrain/summary")).data;

export const getLayer = async (name: string) =>
  (await apiClient.get<GeoJSON.FeatureCollection>(`/layers/${name}`)).data;

export const hillshadeUrl = `${API_BASE_URL}/terrain/hillshade.png`;
export const elevationUrl = (low = 2, high = 98) => `${API_BASE_URL}/terrain/elevation.png?low=${low}&high=${high}`;
export const terrainTileUrl = `${API_BASE_URL}/terrain/dem/{z}/{x}/{y}.png`;

export const getHillshadeBounds = async () =>
  (await apiClient.get<{
    coordinates: [[number, number], [number, number], [number, number], [number, number]];
  }>('/terrain/hillshade/bounds')).data.coordinates;

export const getElevationBounds = async () =>
  (await apiClient.get<{
    coordinates: [[number, number], [number, number], [number, number], [number, number]];
  }>('/terrain/elevation/bounds')).data.coordinates;
