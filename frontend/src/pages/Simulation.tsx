import { useEffect, useState } from "react";
import { MapView } from "../components/Map/MapView";
import { SimulationControls } from "../components/SimulationControls/SimulationControls";
import { WeatherControls } from "../components/WeatherControls/WeatherControls";
import { runFloodSimulation } from "../services/flood";
import type { SimulationResponse } from "../types";
import type { CSSProperties } from "react";
import type { BasemapId } from "../map/map";

export function Simulation() {
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWards, setShowWards] = useState(true);
  const [showStreams, setShowStreams] = useState(true);
  const [showFlow, setShowFlow] = useState(true);
  const [showBasemap, setShowBasemap] = useState(true);
  const [basemap, setBasemap] = useState<BasemapId>("openstreetmap");
  const [showHillshade, setShowHillshade] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [error, setError] = useState("");
  const [weatherMode, setWeatherMode] = useState("clear");
  const [daylight, setDaylight] = useState(12);
  const run = async (rainfall: number, duration: number, antecedent: number, c: number) => {
    setLoading(true);
    try {
      setError("");
      setResult(await runFloodSimulation(rainfall, duration, antecedent, c));
    } catch (e) {
      console.error(e);
      const message = e && typeof e === "object" && "response" in e
        ? String((e as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Backend simulation request failed")
        : "Backend is unavailable. Start FastAPI on port 8000.";
      setError(message);
    }
    finally { setLoading(false); }
  };
  useEffect(() => {
    const onFlow = (event: Event) => setShowFlow((event as CustomEvent<boolean>).detail);
    const onWards = (event: Event) => setShowWards((event as CustomEvent<boolean>).detail);
    const onStreams = (event: Event) => setShowStreams((event as CustomEvent<boolean>).detail);
    const onBasemap = (event: Event) => setShowBasemap((event as CustomEvent<boolean>).detail);
    const onBasemapChoice = (event: Event) => setBasemap((event as CustomEvent<BasemapId>).detail);
    const onHillshade = (event: Event) => setShowHillshade((event as CustomEvent<boolean>).detail);
    const onWeatherMode = (event: Event) => setWeatherMode((event as CustomEvent<string>).detail);
    const onDaylight = (event: Event) => setDaylight((event as CustomEvent<number>).detail);
    window.addEventListener("map:flow", onFlow);
      window.addEventListener("map:wards", onWards);
      window.addEventListener("map:streams", onStreams);
    window.addEventListener("map:basemap-visibility", onBasemap);
    window.addEventListener("map:basemap", onBasemapChoice);
    window.addEventListener("map:hillshade", onHillshade);
    window.addEventListener("weather:mode", onWeatherMode);
    window.addEventListener("weather:daylight", onDaylight);
    return () => {
      window.removeEventListener("map:flow", onFlow);
        window.removeEventListener("map:wards", onWards);
        window.removeEventListener("map:streams", onStreams);
      window.removeEventListener("map:basemap-visibility", onBasemap);
      window.removeEventListener("map:basemap", onBasemapChoice);
      window.removeEventListener("map:hillshade", onHillshade);
      window.removeEventListener("weather:mode", onWeatherMode);
      window.removeEventListener("weather:daylight", onDaylight);
    };
  }, []);
  return (
    <div className="screen">
      <header className="topbar"><div><h1>SCENARIO SIMULATION</h1><p>Explore rainfall-driven spatial change</p></div></header>
      <main className="workspace">
        <aside className={`sidebar ${sidebarVisible ? "" : "sidebar-collapsed"}`}>
          <SimulationControls onRun={run} loading={loading} />
          <WeatherControls />
          {error && <div className="alert simulation-error">{error}</div>}
          {result && <section className="panel">
            <h3>Scenario result</h3>
            <div className="risk-legend"><span><i className="risk-swatch affected" />Screened affected</span><span><i className="risk-swatch height" />Building height</span></div>
            <div className="metric"><span>Scenario</span><b>{result.scenario_id}</b></div>
            <div className="metric"><span>Rainfall intensity</span><b>{result.intensity_mm_hr.toFixed(1)} mm/hr</b></div>
            <div className="metric"><span>Screened area</span><b>{result.affected_area_km2.toFixed(3)} km²</b></div>
            <div className="metric"><span>Threshold</span><b>{result.hazard_threshold}</b></div>
          </section>}
        </aside>
        <section className={`map showcase-3d weather-${weatherMode}`} style={{ "--daylight": `${0.72 + (daylight / 24) * 0.28}` } as CSSProperties}><button className="sidebar-toggle" onClick={() => setSidebarVisible(value => !value)} title="Toggle scenario panel">{sidebarVisible ? "‹" : "›"}</button><MapView flood={result?.inundation_geojson ?? null} basemap={basemap} showBasemap={showBasemap} threeDShowcase showBuildings showWards={showWards} showStreams={showStreams} showFlow={showFlow} showHillshade={showHillshade} showElevation={false} /></section>
      </main>
    </div>
  );
}
