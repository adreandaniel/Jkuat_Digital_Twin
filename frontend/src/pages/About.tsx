import { useEffect, useState } from "react";
import { getTerrainSummary } from "../services/terrain";
import type { TerrainSummary } from "../types";

export function About() {
  const [terrain, setTerrain] = useState<TerrainSummary | null>(null);
  const [status, setStatus] = useState("Loading evidence");

  const refreshEvidence = async () => {
    setStatus("Refreshing evidence");
    try {
      setTerrain(await getTerrainSummary());
      setStatus(`Updated ${new Date().toLocaleTimeString()}`);
    } catch {
      setStatus("Terrain evidence unavailable");
    }
  };

  useEffect(() => { void refreshEvidence(); }, []);

  return <main className="methodology-page">
    <header className="methodology-header">
      <div>
        <p className="eyebrow">MODEL NOTE · JUJA</p>
        <h1>How the twin reads the landscape</h1>
        <p className="methodology-lede">A short record of what is observed, derived, screened, and still unvalidated.</p>
      </div>
      <button className="refresh-button" onClick={() => void refreshEvidence()}>Refresh evidence</button>
    </header>

    <section className="evidence-grid">
      <article><span className="evidence-index">01</span><h2>Observed</h2><p>JHUB Conduit telemetry supplies rainfall and weather when valid credentials and observations are available.</p></article>
      <article><span className="evidence-index">02</span><h2>Derived</h2><p>The conditioned DEM, slope, flow accumulation, streams, watersheds, and native hillshade describe terrain and drainage structure.</p></article>
      <article><span className="evidence-index">03</span><h2>Scenario</h2><p>Rainfall and terrain proxies produce a screening extent. It is not a measured flood depth or hydraulic prediction.</p></article>
      <article><span className="evidence-index">04</span><h2>Validated</h2><p>Not available yet. Calibration needs observed flood extents, channel geometry, roughness, hyetographs, and field validation.</p></article>
    </section>

    <section className="methodology-section">
      <div>
        <p className="eyebrow">TERRAIN VISUALIZATION</p>
        <h2>Where the hillshade went</h2>
        <p>The main dashboard is deliberately 2D, so the QGIS hillshade is no longer stretched over the operational map. The separate Juja showcase uses the conditioned DEM as terrain-RGB tiles. MapLibre builds the 3D ground from those elevation values and calculates native hillshade from the same surface.</p>
        <p>The original QGIS <code>hillshade.tif</code> remains available as a static output at <code>/api/v1/terrain/hillshade.png</code>. It is kept separate so a flat raster is not mistaken for the interactive 3D terrain.</p>
      </div>
      <div className="evidence-readout">
        <span>Current terrain evidence</span>
        <strong>{terrain ? `${terrain.elevation_min_m}–${terrain.elevation_max_m} m` : "—"}</strong>
        <small>{terrain ? `${terrain.resolution_m} m grid · ${terrain.crs}` : status}</small>
        <small>{status}</small>
      </div>
    </section>

    <p className="methodology-boundary">The flood product is a terrain–rainfall screening model, not a calibrated hydraulic prediction. Building extrusion in the showcase is illustrative and uses building metadata for height.</p>
  </main>;
}
