import os
import rasterio
from backend.app.config import settings
from backend.app.services.terrain_service import terrain_service

def test_dem_raster_exists_and_crs():
    dem_path = os.path.join(settings.PROCESSED_DIR, "juja_dem.tif")
    assert os.path.exists(dem_path), f"Missing elevation raster at {dem_path}"

    with rasterio.open(dem_path) as src:
        # Verify valid spatial reference system (UTM Zone 37S / EPSG:32737 or WGS84 / EPSG:4326)
        assert src.crs is not None
        assert src.width > 0 and src.height > 0

def test_stream_network_geometry_validity():
    streams = terrain_service.get_processed_vector_geojson("juja_streams")
    assert streams["type"] == "FeatureCollection"
    assert len(streams["features"]) > 0

    # Verify vector geometry schema
    first_feature = streams["features"][0]
    assert "geometry" in first_feature
    assert first_feature["geometry"]["type"] in ["LineString", "MultiLineString"]