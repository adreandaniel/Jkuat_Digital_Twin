import type { FloodResult } from "../../types";

export function FloodPanel({ flood }: { flood: FloodResult | null }) {
  if (!flood) return <section className="panel"><h3>Flood screening</h3><p>No live flood result.</p></section>;
  return (
    <section className="panel">
      <h3>Live flood screening</h3>
      <div className="metric"><span>Screened area</span><b>{flood.impact_summary.affected_area_km2.toFixed(3)} km²</b></div>
      <div className="metric"><span>Intensity</span><b>{flood.impact_summary.intensity_mm_hr.toFixed(1)} mm/hr</b></div>
      <div className="metric"><span>Runoff C</span><b>{flood.impact_summary.runoff_coefficient.toFixed(2)}</b></div>
      <p className="note">{flood.impact_summary.note}</p>
    </section>
  );
}
