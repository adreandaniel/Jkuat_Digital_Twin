from backend.app.models.weather import WeatherObservation
from backend.app.services.rainfall_service import rainfall_service
from backend.app.services.hydrology_service import hydrology_service

def test_rainfall_intensity_scaling():
    # 12.4mm in 15 mins should equal 49.6 mm/hr
    obs = WeatherObservation(
        timestamp="2026-09-16T08:00:00EAT",
        station_id="JHUB_JUJA_01",
        rg1=12.4,
        rg1tt=45.2,
        rg1tp=32.8,
        temperature=18.5,
        humidity=88.0,
        pressure=1013.2,
        wind_speed=3.1
    )
    metrics = rainfall_service.process_metrics(obs)
    assert metrics.intensity_mm_hr == 49.6

def test_runoff_coefficient_saturation_scaling():
    # High prior rainfall (>30mm) must scale soil saturation factor
    effective_c = hydrology_service.runoff_coefficient(antecedent_3h_mm=35.0, base_c=0.55)
    assert effective_c == 0.80  # 0.55 + 0.25 saturation offset