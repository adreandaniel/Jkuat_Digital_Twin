import { useState } from "react";

type WeatherMode = "clear" | "cloudy" | "rain" | "storm" | "night";

const modes: { id: WeatherMode; icon: string; label: string }[] = [
  { id: "clear", icon: "☀", label: "Clear" },
  { id: "cloudy", icon: "⛅", label: "Cloudy" },
  { id: "rain", icon: "🌧", label: "Rain" },
  { id: "storm", icon: "⛈", label: "Storm" },
  { id: "night", icon: "☾", label: "Night" }
];

export function WeatherControls() {
  const [mode, setMode] = useState<WeatherMode>("clear");
  const [daylight, setDaylight] = useState(12);

  const chooseMode = (next: WeatherMode) => {
    setMode(next);
    window.dispatchEvent(new CustomEvent("weather:mode", { detail: next }));
  };

  return <section className="panel weather-controls">
    <h3>Visual weather</h3>
    <div className="weather-mode-grid">
      {modes.map(item => <button key={item.id} className={mode === item.id ? "active" : ""} onClick={() => chooseMode(item.id)}><span>{item.icon}</span>{item.label}</button>)}
    </div>
    <label className="range-label"><span>Daylight</span><output>{String(Math.floor(daylight)).padStart(2, "0")}:{String(Math.round((daylight % 1) * 60)).padStart(2, "0")}</output></label>
    <input className="range-input" type="range" min="0" max="24" step="0.25" value={daylight} onChange={event => { const value = Number(event.target.value); setDaylight(value); window.dispatchEvent(new CustomEvent("weather:daylight", { detail: value })); }} />
    <small className="control-note">Visual atmosphere only. Conduit remains the source for measured weather.</small>
  </section>;
}
