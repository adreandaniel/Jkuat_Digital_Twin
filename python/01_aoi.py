import geopandas as gpd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run():
    src = ROOT / "data/reference/juja_wards.geojson"
    out = ROOT / "data/processed/juja_aoi.geojson"
    gdf = gpd.read_file(src).to_crs(4326)
    aoi = gdf.dissolve()
    aoi.to_file(out, driver="GeoJSON")
    print(f"Saved operational Juja AOI: {out}")


if __name__ == "__main__":
    run()
