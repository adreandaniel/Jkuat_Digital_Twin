export interface WeatherData {
  timestamp: string;
  station_id: string;
  source?: string;
  rg1: number;
  rg2: number;
  rg1tt: number;
  rg2tt: number;
  rg1tp: number;
  rg2tp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  wind_gust: number;
  wind_gust_direction: number;
}

export interface FloodResult {
  timestamp: string;
  scenario_name: string;
  model_type: string;
  impact_summary: {
    affected_area_km2: number;
    rainfall_mm: number;
    intensity_mm_hr: number;
    runoff_coefficient: number;
    note: string;
  };
  inundation_geojson: GeoJSON.FeatureCollection;
}

export interface SimulationResponse {
  scenario_id: string;
  model_type: string;
  rainfall_mm: number;
  duration_hr: number;
  intensity_mm_hr: number;
  runoff_coefficient: number;
  hazard_threshold: number;
  affected_area_km2: number;
  inundated_feature_count: number;
  inundation_geojson: GeoJSON.FeatureCollection;
  methodology_note: string;
}

export interface TerrainSummary {
  crs: string;
  resolution_m: number;
  bounds: [number, number, number, number];
  elevation_min_m: number;
  elevation_max_m: number;
  slope_mean_deg?: number;
}
