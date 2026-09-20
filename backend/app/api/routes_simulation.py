from fastapi import APIRouter, HTTPException
from ..models.flood import SimulationRequest, SimulationResponse
from ..services.simulation_service import simulation_service

router = APIRouter(prefix="/simulation", tags=["Simulation"])


@router.post("/run", response_model=SimulationResponse)
def run(req: SimulationRequest):
    try:
        return simulation_service.run_flood_model(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
