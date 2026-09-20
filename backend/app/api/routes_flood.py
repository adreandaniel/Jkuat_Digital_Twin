from fastapi import APIRouter, HTTPException
from ..models.flood import FloodResult, SimulationRequest
from ..models.weather import WeatherObservation
from ..services.conduit_service import conduit_service
from ..services.rainfall_service import rainfall_service
from ..services.simulation_service import simulation_service

router = APIRouter(prefix="/flood", tags=["Flood Operations"])


@router.get("/current", response_model=FloodResult)
def current_flood():
    try:
        obs = WeatherObservation(**conduit_service.fetch_latest_observations())
        metrics = rainfall_service.process_metrics(obs)
        sim = simulation_service.run_flood_model(
            SimulationRequest(
                rainfall_mm=metrics.interval_rainfall_mm,
                duration_hr=0.25,
                antecedent_3h_mm=metrics.antecedent_mm,
                land_cover_factor=0.65,
            )
        )
        return FloodResult(
            timestamp=obs.timestamp,
            scenario_name="Live station-driven screening",
            model_type=sim.model_type,
            impact_summary={
                "affected_area_km2": sim.affected_area_km2,
                "rainfall_mm": metrics.interval_rainfall_mm,
                "intensity_mm_hr": metrics.intensity_mm_hr,
                "runoff_coefficient": sim.runoff_coefficient,
                "note": sim.methodology_note,
            },
            inundation_geojson=sim.inundation_geojson,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
