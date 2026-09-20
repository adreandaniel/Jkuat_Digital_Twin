import { useEffect, useState } from "react";
import { getRainfallHistory } from "../../services/weather";

interface HistoryRow { ts?: string; timestamp?: string; rg1?: string | number; rain?: string | number; }

export function RainfallTimeline() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [status, setStatus] = useState("Loading rainfall history");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    getRainfallHistory(48).then(result => {
      setRows(result.records ?? []);
      setStatus(result.records?.length ? "Recent station history" : "No exported history available");
    }).catch(() => setStatus("History unavailable"));
  }, []);

  const values = rows.map(row => Number(row.rg1 ?? row.rain ?? 0)).filter(value => Number.isFinite(value));
  const max = Math.max(...values, 1);

  return <section className={`timeline-panel ${collapsed ? "is-collapsed" : ""}`}>
    <div className="timeline-heading"><div><span className="eyebrow">RAINFALL TIMELINE</span><strong>{status}</strong></div><div className="timeline-heading-actions"><span>{rows.length ? `${rows.length} readings` : "—"}</span><button className="timeline-toggle" onClick={() => setCollapsed(value => !value)} aria-expanded={!collapsed} aria-label={collapsed ? "Expand rainfall timeline" : "Collapse rainfall timeline"}>{collapsed ? "+" : "−"}</button></div></div>
    {!collapsed && (values.length ? <div className="rain-bars" aria-label="Rainfall history">{values.map((value, index) => <span key={index} style={{ height: `${Math.max(4, (value / max) * 100)}%` }} title={`${value.toFixed(2)} mm`} />)}</div> : <div className="timeline-empty">Connect or export Conduit history to populate this view.</div>)}
  </section>;
}
