import io
import json
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from PIL import Image
from rasterio.enums import Resampling
from rasterio.transform import from_bounds
from rasterio.warp import reproject

from ..config import settings


VECTOR_FILES = {
    "juja_wards": settings.REFERENCE_DIR / "juja_wards.geojson",
    "juja_constituency": settings.REFERENCE_DIR / "juja_constituency.geojson",
    "kiambu_subcounties": settings.REFERENCE_DIR / "kiambu_subcounties.geojson",
    "kiambu_county": settings.REFERENCE_DIR / "kiambu_county.geojson",
}


class TerrainService:
    def _wgs84_corners(self, bounds) -> list[list[float]]:
        from rasterio.warp import transform
        xs = [bounds.left, bounds.right, bounds.right, bounds.left]
        ys = [bounds.top, bounds.top, bounds.bottom, bounds.bottom]
        source_crs = "+proj=utm +zone=37 +south +datum=WGS84 +units=m +no_defs"
        target_crs = "+proj=longlat +datum=WGS84 +no_defs"
        lons, lats = transform(source_crs, target_crs, xs, ys)
        return [[lons[0], lats[0]], [lons[1], lats[1]],
                [lons[2], lats[2]], [lons[3], lats[3]]]

    def get_reference_geojson(self, name: str) -> dict:
        path = VECTOR_FILES.get(name)
        if path is None:
            raise FileNotFoundError(f"Unknown reference layer: {name}")
        if not path.exists():
            raise FileNotFoundError(str(path))

        gdf = gpd.read_file(path).to_crs(4326)
        return json.loads(gdf.to_json())

    def get_processed_vector_geojson(self, name: str) -> dict:
        mapping = {
            "juja_streams": settings.PROCESSED_DIR / "stream.gpkg",
            "juja_watersheds": settings.PROCESSED_DIR / "watershed.gpkg",
        }
        path = mapping.get(name)
        if path is None or not path.exists():
            raise FileNotFoundError(f"Processed layer not found: {name}")

        gdf = gpd.read_file(path).to_crs(4326)
        # Avoid sending thousands of unnecessary decimal places.
        return json.loads(gdf.to_json(drop_id=True))

    def summary(self) -> dict:
        dem = settings.PROCESSED_DIR / "conditioned_dem.tif"
        slope = settings.PROCESSED_DIR / "slope.tif"
        if not dem.exists():
            raise FileNotFoundError("conditioned_dem.tif not found")

        with rasterio.open(dem) as src:
            band = src.read(1, masked=True)
            stats = {
                "crs": str(src.crs),
                "resolution_m": round(float(src.res[0]), 2),
                "bounds": [float(x) for x in src.bounds],
                "elevation_min_m": round(float(band.min()), 1),
                "elevation_max_m": round(float(band.max()), 1),
            }

        if slope.exists():
            with rasterio.open(slope) as src:
                s = src.read(1, masked=True)
                stats["slope_mean_deg"] = round(float(s.mean()), 2)

        return stats

    def hillshade_png(self) -> tuple[bytes, list[list[float]]]:
        path = settings.PROCESSED_DIR / "hillshade.tif"
        if not path.exists():
            raise FileNotFoundError("hillshade.tif not found")

        with rasterio.open(path) as src:
            arr = src.read(1, masked=True).astype("float32")
            # Downsample for browser delivery.
            max_side = 720
            scale = max(arr.shape) / max_side
            if scale > 1:
                out_h = max(1, int(arr.shape[0] / scale))
                out_w = max(1, int(arr.shape[1] / scale))
                from rasterio.enums import Resampling
                arr = src.read(1, out_shape=(1, out_h, out_w),
                               resampling=Resampling.average,
                               masked=True).astype("float32")
                bounds = src.bounds
            else:
                bounds = src.bounds

            data = np.asarray(arr)
            lo, hi = np.nanpercentile(data, [2, 98])
            img = np.clip((data - lo) / max(hi - lo, 1), 0, 1) * 255
            alpha = np.where(np.ma.getmaskarray(arr), 0, 255).astype("uint8")
            img = np.nan_to_num(img, nan=0).astype("uint8")

            # Preserve no-data as transparent so relief can sit over a basemap.
            rgba = np.dstack([img, img, img, alpha])
            pil = Image.fromarray(rgba, mode="RGBA")
            bio = io.BytesIO()
            pil.save(bio, format="PNG", optimize=True)

            return bio.getvalue(), self._wgs84_corners(bounds)

    def elevation_png(self, low_percentile: float = 2, high_percentile: float = 98) -> tuple[bytes, list[list[float]]]:
        path = settings.PROCESSED_DIR / "conditioned_dem.tif"
        if not path.exists():
            raise FileNotFoundError("conditioned_dem.tif not found")

        with rasterio.open(path) as src:
            arr = src.read(1, masked=True).astype("float32")
            max_side = 1200
            scale = max(arr.shape) / max_side
            if scale > 1:
                out_h = max(1, int(arr.shape[0] / scale))
                out_w = max(1, int(arr.shape[1] / scale))
                arr = src.read(1, out_shape=(1, out_h, out_w),
                               resampling=Resampling.bilinear, masked=True).astype("float32")
            bounds = src.bounds

        data = np.asarray(arr)
        lo, hi = np.nanpercentile(data, [low_percentile, high_percentile])
        stops = np.array([
            [0, 92, 48], [0, 190, 82], [176, 220, 46],
            [255, 214, 0], [255, 112, 0], [226, 24, 40]
        ], dtype="float32")
        scaled = np.clip((data - lo) / max(hi - lo, 1), 0, 1)
        positions = scaled * (len(stops) - 1)
        lower = np.floor(positions).astype("int32")
        upper = np.minimum(lower + 1, len(stops) - 1)
        fraction = (positions - lower)[..., None]
        rgb = stops[lower] * (1 - fraction) + stops[upper] * fraction
        rgb[np.isnan(data)] = 0

        alpha = np.where(np.ma.getmaskarray(arr), 0, 235).astype("uint8")
        rgba = np.dstack([np.clip(rgb, 0, 255).astype("uint8"), alpha])
        bio = io.BytesIO()
        Image.fromarray(rgba, mode="RGBA").save(bio, format="PNG", optimize=True)
        return bio.getvalue(), self._wgs84_corners(bounds)

    def hillshade_bounds(self) -> list[list[float]]:
        path = settings.PROCESSED_DIR / "hillshade.tif"
        if not path.exists():
            raise FileNotFoundError("hillshade.tif not found")

        with rasterio.open(path) as src:
            bounds = src.bounds

        return self._wgs84_corners(bounds)

    def elevation_bounds(self) -> list[list[float]]:
        path = settings.PROCESSED_DIR / "conditioned_dem.tif"
        if not path.exists():
            raise FileNotFoundError("conditioned_dem.tif not found")

        with rasterio.open(path) as src:
            return self._wgs84_corners(src.bounds)

    def dem_tile(self, zoom: int, x: int, y: int) -> bytes:
        """Return one MapLibre terrain-RGB tile from the conditioned DEM."""
        if zoom < 0 or x < 0 or y < 0 or x >= 2 ** zoom or y >= 2 ** zoom:
            raise FileNotFoundError("Invalid terrain tile")

        path = settings.PROCESSED_DIR / "conditioned_dem.tif"
        if not path.exists():
            raise FileNotFoundError("conditioned_dem.tif not found")

        world = 20037508.342789244
        tile_size = 256
        tile_span = (world * 2) / (2 ** zoom)
        left = -world + x * tile_span
        right = left + tile_span
        top = world - y * tile_span
        bottom = top - tile_span
        dst_transform = from_bounds(left, bottom, right, top, tile_size, tile_size)
        elevation = np.full((tile_size, tile_size), np.nan, dtype="float32")

        with rasterio.open(path) as src:
            reproject(
                source=rasterio.band(src, 1),
                destination=elevation,
                src_transform=src.transform,
                src_crs=src.crs,
                src_nodata=src.nodata,
                dst_transform=dst_transform,
                dst_crs=(
                    "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 "
                    "+lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext"
                ),
                dst_nodata=np.nan,
                resampling=Resampling.bilinear,
            )

        encoded = np.nan_to_num((elevation + 10000) * 10, nan=0)
        encoded = np.clip(np.rint(encoded), 0, 16777215).astype("uint32")
        rgb = np.stack([
            (encoded // 65536) & 255,
            (encoded // 256) & 255,
            encoded & 255,
        ], axis=-1).astype("uint8")

        bio = io.BytesIO()
        Image.fromarray(rgb, mode="RGB").save(bio, format="PNG", optimize=True)
        return bio.getvalue()


terrain_service = TerrainService()
