def test_flood_simulation_output(client):
    payload = {
        "rainfall_mm": 50.0,
        "duration_hr": 1.0,
        "antecedent_3h_mm": 20.0,
        "land_cover_factor": 0.65
    }
    response = client.post("/api/v1/simulation/run", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["affected_area_km2"] > 0
    assert data["model_type"] == "terrain-rainfall screening model"
    assert data["intensity_mm_hr"] == 50.0
    assert data["inundation_geojson"]["type"] == "FeatureCollection"