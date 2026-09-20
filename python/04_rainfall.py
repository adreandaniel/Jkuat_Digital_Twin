from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]


def run():
    src = ROOT / "data/raw/conduit_raw.csv"
    if not src.exists() or src.stat().st_size == 0:
        print("No exported Conduit CSV yet; live API remains the source of truth.")
        return
    df = pd.read_csv(src)
    if "ts" in df:
        df["datetime"] = pd.to_datetime(df["ts"], utc=True, errors="coerce")
    out = ROOT / "data/derived/rainfall_history.parquet"
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out, index=False)
    print(f"Saved rainfall history: {out}")


if __name__ == "__main__":
    run()
