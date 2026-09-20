from pathlib import Path
import rasterio

ROOT = Path(__file__).resolve().parents[1]


def run():
    required = ["conditioned_dem.tif", "slope.tif", "hillshade.tif"]
    for name in required:
        p = ROOT / "data/processed" / name
        if not p.exists():
            raise FileNotFoundError(p)
        with rasterio.open(p) as src:
            print(f"{name}: {src.crs}, resolution={src.res}, shape={src.shape}")
    print("Terrain stage verified. No synthetic DEM is generated.")


if __name__ == "__main__":
    run()
