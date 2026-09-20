from datetime import datetime, timedelta, timezone
import csv
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from ..config import settings
from ..models.weather import WeatherObservation, RainfallMetrics
from ..services.conduit_service import conduit_service
from ..services.rainfall_service import rainfall_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current", response_model=WeatherObservation)
def current_weather():
    try:
        return WeatherObservation(**conduit_service.fetch_latest_observations())
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/metrics", response_model=RainfallMetrics)
def current_metrics():
    try:
        obs = WeatherObservation(**conduit_service.fetch_latest_observations())
        return rainfall_service.process_metrics(obs)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/history")
def rainfall_history(limit: int = Query(5000, ge=1, le=50000)):
    path = settings.RAW_DIR / "conduit_raw.csv"
    if not path.exists() or path.stat().st_size == 0:
        return {"records": [], "source": "data/raw/conduit_raw.csv", "note": "No exported history is bundled yet."}

    rows = []
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows.append(row)
    rows = rows[-limit:]
    return {"records": rows, "source": "JHUB Conduit historical export"}
