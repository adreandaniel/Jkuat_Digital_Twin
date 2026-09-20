import type { TerrainSummary } from "../../types";

export function TerrainPanel({ terrain }: { terrain: TerrainSummary | null }) {
  return (
    <section className="panel">
      <h3>Terrain</h3>
      {terrain ? <>
        <div className="metric"><span>Elevation</span><b>{terrain.elevation_min_m}–{terrain.elevation_max_m} m</b></div>
        <div className="metric"><span>Resolution</span><b>{terrain.resolution_m} m</b></div>
        <div className="metric"><span>CRS</span><b>{terrain.crs}</b></div>
      </> : <p>Loading terrain…</p>}
    </section>
  );
}
