import type { SimulationResponse, TerrainSummary } from "../../types";

export function SummaryStatistics({ terrain, simulation }: {
  terrain: TerrainSummary | null, simulation: SimulationResponse | null
}) {
  return (
    <div className="stats">
      <div><small>Study CRS</small><strong>{terrain?.crs ?? "—"}</strong></div>
      <div><small>Terrain resolution</small><strong>{terrain ? `${terrain.resolution_m} m` : "—"}</strong></div>
      <div><small>Scenario area</small><strong>{simulation ? `${simulation.affected_area_km2} km²` : "—"}</strong></div>
    </div>
  );
}
