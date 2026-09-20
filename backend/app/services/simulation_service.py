import json
import uuid

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import shapes
from shapely.geometry import shape

from ..config import settings
from ..models.flood import SimulationRequest, SimulationResponse
from .hydrology_service import hydrology_service


class SimulationService:
    def run_flood_model(self, req: SimulationRequest) -> SimulationResponse:
        result = hydrology_service.screening_index(
            req.rainfall_mm, req.duration_hr,
            req.antecedent_3h_mm, req.land_cover_factor
        )

        with rasterio.open(hydrology_service.acc_path) as src:
            acc = src.read(1, masked=True).astype("float32")
            slope = rasterio.open(hydrology_service.slope_path).read(1, masked=True).astype("float32")
            valid = result["valid_mask"]

            out = np.zeros(acc.shape, dtype="uint8")
            index = np.zeros(acc.shape, dtype="float32")
            index[valid] = result["index"]
            out[(index >= result["threshold"]) & valid] = 1

            # Vectorize connected flood-screening cells.
            geoms = []
            for geom, value in shapes(out, mask=out.astype(bool), transform=src.transform):
                if value == 1:
                    geoms.append(shape(geom))

            if geoms:
                gdf = gpd.GeoDataFrame(
                    {"hazard": [1] * len(geoms)}, geometry=geoms, crs=src.crs
                ).to_crs(4326)
                geojson = json.loads(gdf.to_json(drop_id=True))
                area_km2 = float(gdf.to_crs(32737).area.sum() / 1_000_000)
            else:
                geojson = {"type": "FeatureCollection", "features": []}
                area_km2 = 0.0

        return SimulationResponse(
            scenario_id=f"SCN-{uuid.uuid4().hex[:8].upper()}",
            model_type="terrain-rainfall screening model",
            rainfall_mm=req.rainfall_mm,
            duration_hr=req.duration_hr,
            intensity_mm_hr=round(result["intensity_mm_hr"], 2),
            runoff_coefficient=result["runoff_coefficient"],
            hazard_threshold=round(result["threshold"], 3),
            affected_area_km2=round(area_km2, 3),
            inundated_feature_count=len(geojson["features"]),
            inundation_geojson=geojson,
            methodology_note=(
                "Screening extent derived from flow accumulation + slope + rainfall "
                "intensity. It is not a measured flood extent or hydraulic depth model."
            ),
        )


simulation_service = SimulationService()
