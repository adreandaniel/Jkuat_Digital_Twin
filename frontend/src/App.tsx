import { useState } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Simulation } from "./pages/Simulation";
import "./styles.css";

export default function App() {
  const [page, setPage] = useState<"dashboard" | "simulation" | "about">("dashboard");
  return <>
    <nav className="nav">
      <div className="nav-brand"><span className="nav-brand-icon">🏛</span><span><strong>JKUAT DIGITAL TWIN</strong><small>Juja Campus · Thika Road, Kenya</small></span></div>
      <div className="nav-divider" />
      <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>⌂ <span>Dashboard</span></button>
      <button className={page === "simulation" ? "active" : ""} onClick={() => setPage("simulation")}>⚙ <span>Simulation</span></button>
    </nav>
    {page === "dashboard" && <Dashboard />}
    {page === "simulation" && <Simulation />}
  </>;
}
