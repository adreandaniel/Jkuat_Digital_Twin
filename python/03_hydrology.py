from pathlib import Path
import rasterio

ROOT = Path(__file__).resolve().parents[1]


def run():
    for name in ["conditioned_dem.tif", "flow_direction.tif", "flow_accumulation.tif"]:
        p = ROOT / "data/processed" / name
        if not p.exists():
            raise FileNotFoundError(p)
        with rasterio.open(p) as src:
            print(f"{name}: CRS={src.crs}, shape={src.shape}, resolution={src.res}")
    for name in ["stream.gpkg", "watershed.gpkg"]:
        p = ROOT / "data/processed" / name
        if not p.exists():
            raise FileNotFoundError(p)
    print("Hydrology stage verified from supplied QGIS outputs.")


if __name__ == "__main__":
    run()
