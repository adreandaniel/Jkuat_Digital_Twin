from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from ..services.terrain_service import terrain_service

router = APIRouter(prefix="/terrain", tags=["Terrain & Hydrology"])


@router.get("/summary")
def terrain_summary():
    try:
        return terrain_service.summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/streams")
def streams():
    try:
        return terrain_service.get_processed_vector_geojson("juja_streams")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/watersheds")
def watersheds():
    try:
        return terrain_service.get_processed_vector_geojson("juja_watersheds")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/hillshade.png")
def hillshade():
    try:
        content, _ = terrain_service.hillshade_png()
        return Response(content=content, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/hillshade/bounds")
def hillshade_bounds():
    try:
        return {"coordinates": terrain_service.hillshade_bounds()}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/elevation.png")
def elevation(
    low: float = Query(2, ge=0, le=49),
    high: float = Query(98, ge=51, le=100),
):
    try:
        content, _ = terrain_service.elevation_png(low, high)
        return Response(content=content, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/elevation/bounds")
def elevation_bounds():
    try:
        return {"coordinates": terrain_service.elevation_bounds()}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/dem/{zoom}/{x}/{y}.png")
def dem_tile(zoom: int, x: int, y: int):
    try:
        return Response(
            content=terrain_service.dem_tile(zoom, x, y),
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=3600"},
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
