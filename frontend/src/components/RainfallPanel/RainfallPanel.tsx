import type { WeatherData } from "../../types";

export function RainfallPanel({ weather }: { weather: WeatherData | null }) {
  if (!weather) return <section className="panel"><h3>Weather snapshot</h3><p>Waiting for station data…</p></section>;
  const weatherState = weather.rg1 >= 10 ? "Storm conditions" : weather.rg1 >= 2 ? "Rain conditions" : weather.rg1 > 0 ? "Light rain" : "Clear interval";
  return (
    <section className="panel">
      <h3>{weather.source ? "Weather snapshot" : "Live JHUB telemetry"}</h3>
      {weather.source && <div className="data-badge">{weather.source}</div>}
      <div className="weather-state"><span>{weather.rg1 >= 2 ? "🌧" : "☀"}</span><strong>{weatherState}</strong><small>Measured station state</small></div>
      <div className="metric"><span>Current interval</span><b>{weather.rg1.toFixed(2)} mm</b></div>
      <div className="metric"><span>Total today</span><b>{weather.rg1tt.toFixed(2)} mm</b></div>
      <div className="metric"><span>Antecedent</span><b>{weather.rg1tp.toFixed(2)} mm</b></div>
      <div className="metric"><span>Temperature</span><b>{weather.temperature.toFixed(1)} °C</b></div>
      <div className="metric"><span>Humidity</span><b>{weather.humidity.toFixed(1)} %</b></div>
      <small>{weather.timestamp}</small>
    </section>
  );
}
