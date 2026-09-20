import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { MapView } from "../components/Map/MapView";
import type { BasemapId } from "../map/map";
import { RainfallPanel } from "../components/RainfallPanel/RainfallPanel";
import { FloodPanel } from "../components/FloodPanel/FloodPanel";
import { TerrainPanel } from "../components/Terrain/TerrainPanel";
import { WeatherControls } from "../components/WeatherControls/WeatherControls";
import { RainfallTimeline } from "../components/Timeline/RainfallTimeline";
import { getCurrentWeather } from "../services/weather";
import { getCurrentFlood } from "../services/flood";
import { getTerrainSummary } from "../services/terrain";
import type { FloodResult, TerrainSummary, WeatherData } from "../types";

export function Dashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [flood, setFlood] = useState<FloodResult | null>(null);
  const [terrain, setTerrain] = useState<TerrainSummary | null>(null);
  const [error, setError] = useState("");
  const [basemap, setBasemap] = useState<BasemapId>("openstreetmap");
  const [showBasemap, setShowBasemap] = useState(true);
  const [showWards, setShowWards] = useState(true);
  const [showStreams, setShowStreams] = useState(true);
  const [showFlow, setShowFlow] = useState(false);
  const [showHillshade, setShowHillshade] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [mapStatus, setMapStatus] = useState("Ready");
  const [coordinate, setCoordinate] = useState("Juja study area");
  const [clock, setClock] = useState("--:--:--");
  const [weatherMode, setWeatherMode] = useState("clear");
  const [daylight, setDaylight] = useState(12);

  const refresh = async () => {
    const [weatherResult, floodResult, terrainResult] = await Promise.allSettled([
      getCurrentWeather(), getCurrentFlood(), getTerrainSummary()
    ]);
    if (weatherResult.status === "fulfilled") setWeather(weatherResult.value);
    else setWeather(null);
    if (floodResult.status === "fulfilled") setFlood(floodResult.value);
    if (terrainResult.status === "fulfilled") setTerrain(terrainResult.value);
    setError(weatherResult.status === "rejected" ? "JHUB weather unavailable. Configure JHUB_API_KEY and JHUB_EMAIL to load live telemetry." : "");
  };

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-KE", { hour12: false }));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handlers = [
      ["map:basemap", (event: Event) => setBasemap((event as CustomEvent<BasemapId>).detail)],
      ["map:basemap-visibility", (event: Event) => setShowBasemap((event as CustomEvent<boolean>).detail)],
      ["map:wards", (event: Event) => setShowWards((event as CustomEvent<boolean>).detail)],
      ["map:streams", (event: Event) => setShowStreams((event as CustomEvent<boolean>).detail)],
      ["map:flow", (event: Event) => setShowFlow((event as CustomEvent<boolean>).detail)],
      ["map:hillshade", (event: Event) => setShowHillshade((event as CustomEvent<boolean>).detail)],
      ["weather:mode", (event: Event) => setWeatherMode((event as CustomEvent<string>).detail)],
      ["weather:daylight", (event: Event) => setDaylight((event as CustomEvent<number>).detail)]
    ] as const;
    handlers.forEach(([name, handler]) => window.addEventListener(name, handler));
    return () => handlers.forEach(([name, handler]) => window.removeEventListener(name, handler));
  }, []);

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand-mark">JK</div>
        <div><h1>JUJA DIGITAL TWIN</h1><p>Campus environment · Thika Road, Kenya</p></div>
        <div className="topbar-status"><span className="status-dot" /> {mapStatus} <span className="header-weather">{weatherMode} · {weather?.temperature?.toFixed(0) ?? "—"}°C</span><span className="header-clock">{clock}</span></div>
      </header>
      {error && <div className="alert">{error}</div>}
      <main className="workspace">
        <aside className={`sidebar ${sidebarVisible ? "" : "sidebar-collapsed"}`}>
          <RainfallPanel weather={weather} />
          <WeatherControls />
          <TerrainPanel terrain={terrain} />
          <FloodPanel flood={flood} />
        </aside>
        <section className={`map weather-${weatherMode}`} style={{ "--daylight": `${0.72 + (daylight / 24) * 0.28}` } as CSSProperties}><button className="sidebar-toggle" onClick={() => setSidebarVisible(value => !value)} title="Toggle information panel">{sidebarVisible ? "‹" : "›"}</button><MapView
          flood={flood?.inundation_geojson ?? null}
          basemap={basemap}
          showBasemap={showBasemap}
          showWards={showWards}
          showStreams={showStreams}
          showBuildings
          showFlow={showFlow}
          showHillshade={showHillshade}
          showElevation={false}
          onCoordinateChange={setCoordinate}
          onStatusChange={setMapStatus}
        /><RainfallTimeline /><div className="map-statusbar"><span><i className="status-dot" /> {mapStatus}</span><span>{coordinate} · EPSG:4326</span></div></section>
      </main>
    </div>
  );
}
