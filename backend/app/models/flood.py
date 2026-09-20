from typing import Any, Dict, List
from pydantic import BaseModel


class FloodResult(BaseModel):
    timestamp: str
    scenario_name: str
    model_type: str
    impact_summary: Dict[str, Any]
    inundation_geojson: Dict[str, Any]


class SimulationRequest(BaseModel):
    rainfall_mm: float
    duration_hr: float
    antecedent_3h_mm: float = 0.0
    land_cover_factor: float = 0.65


class SimulationResponse(BaseModel):
    scenario_id: str
    model_type: str
    rainfall_mm: float
    duration_hr: float
    intensity_mm_hr: float
    runoff_coefficient: float
    hazard_threshold: float
    affected_area_km2: float
    inundated_feature_count: int
    inundation_geojson: Dict[str, Any]
    methodology_note: str
