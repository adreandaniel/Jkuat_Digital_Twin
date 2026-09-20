from pydantic import BaseModel, Field


class WeatherObservation(BaseModel):
    timestamp: str
    station_id: str = "JHUB_JUJA_01"

    rg1: float = Field(0.0, description="Rain gauge 1 accumulation for the reporting interval (mm)")
    rg2: float = Field(0.0, description="Rain gauge 2 accumulation for the reporting interval (mm)")
    rg1tt: float = Field(0.0, description="Rain gauge 1 total-today value (mm)")
    rg2tt: float = Field(0.0, description="Rain gauge 2 total-today value (mm)")
    rg1tp: float = Field(0.0, description="Rain gauge 1 prior/antecedent total supplied by the station (mm)")
    rg2tp: float = Field(0.0, description="Rain gauge 2 prior/antecedent total supplied by the station (mm)")

    temperature: float = 0.0
    humidity: float = 0.0
    pressure: float = 0.0
    wind_speed: float = 0.0
    wind_direction: float = 0.0
    wind_gust: float = 0.0
    wind_gust_direction: float = 0.0


class RainfallMetrics(BaseModel):
    timestamp: str
    intensity_mm_hr: float
    interval_rainfall_mm: float
    total_today_mm: float
    antecedent_mm: float
