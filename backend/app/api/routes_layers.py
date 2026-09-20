from fastapi import APIRouter, HTTPException
from ..services.terrain_service import terrain_service

router = APIRouter(prefix="/layers", tags=["Reference Layers"])


@router.get("/{layer_name}")
def layer(layer_name: str):
    try:
        if layer_name in {"juja_wards", "juja_constituency", "kiambu_subcounties", "kiambu_county"}:
            return terrain_service.get_reference_geojson(layer_name)
        if layer_name in {"juja_streams", "juja_watersheds"}:
            return terrain_service.get_processed_vector_geojson(layer_name)
        raise FileNotFoundError(layer_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
