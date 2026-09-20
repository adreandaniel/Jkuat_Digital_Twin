import { useState } from "react";

interface Props {
  onRun: (rainfall: number, duration: number, antecedent: number, c: number) => void;
  loading: boolean;
}

export function SimulationControls({ onRun, loading }: Props) {
  const [rainfall, setRainfall] = useState(40);
  const [duration, setDuration] = useState(2);
  const [antecedent, setAntecedent] = useState(10);
  const [c, setC] = useState(0.65);

  return (
    <section className="panel">
      <h3>What-if simulation</h3>
      <label>Storm rainfall (mm)<input type="number" min="0" max="500" step="0.5" value={rainfall} onChange={e => setRainfall(+e.target.value)} /></label>
      <label>Duration (hours)<input type="number" min="0.083" max="72" step="0.083" value={duration} onChange={e => setDuration(+e.target.value)} /></label>
      <label>Antecedent 3h rainfall (mm)<input type="number" min="0" max="200" step="0.5" value={antecedent} onChange={e => setAntecedent(+e.target.value)} /></label>
      <label>Base runoff coefficient C<input type="number" min="0.1" max="1" step="0.01" value={c} onChange={e => setC(+e.target.value)} /></label>
      <button onClick={() => onRun(rainfall, duration, antecedent, c)} disabled={loading}>
        {loading ? "RUNNING…" : "RUN SCENARIO"}
      </button>
    </section>
  );
}
