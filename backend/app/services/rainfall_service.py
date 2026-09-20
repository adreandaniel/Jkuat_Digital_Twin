from ..models.weather import WeatherObservation, RainfallMetrics


class RainfallService:
    """Converts station observations into hydrologically useful metrics."""

    def process_metrics(self, obs: WeatherObservation) -> RainfallMetrics:
        # The station records in the supplied dataset are approximately 15-minute
        # observations. Four intervals therefore represent one hour.
        interval_mm = max(0.0, obs.rg1)
        intensity = interval_mm * 4.0

        return RainfallMetrics(
            timestamp=obs.timestamp,
            intensity_mm_hr=round(intensity, 2),
            interval_rainfall_mm=round(interval_mm, 2),
            total_today_mm=round(max(0.0, obs.rg1tt), 2),
            antecedent_mm=round(max(0.0, obs.rg1tp), 2),
        )


rainfall_service = RainfallService()
