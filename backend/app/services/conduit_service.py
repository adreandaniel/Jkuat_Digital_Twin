import logging
from datetime import datetime, timedelta, timezone
import requests

from ..config import settings

logger = logging.getLogger(__name__)


class ConduitService:
    """Client for the JHUB Africa Conduit weather-station API."""

    def _normalise(self, row: dict) -> dict:
        def f(key, default=0.0):
            value = row.get(key, default)
            try:
                return float(value)
            except (TypeError, ValueError):
                return float(default)

        return {
            "timestamp": str(row.get("ts") or row.get("timestamp") or ""),
            "station_id": "JHUB_JUJA_01",
            "rg1": f("rg1"),
            "rg2": f("rg2"),
            "rg1tt": f("rg1tt"),
            "rg2tt": f("rg2tt"),
            "rg1tp": f("rg1tp"),
            "rg2tp": f("rg2tp"),
            "temperature": f("temp_bmx"),
            "humidity": f("humidity_sht"),
            "pressure": f("press_bmx"),
            "wind_speed": f("wind_spd"),
            "wind_direction": f("wind_dir"),
            "wind_gust": f("wind_gust"),
            "wind_gust_direction": f("wind_gust_dir"),
        }

    def fetch(self, fromdate: str, todate: str) -> list[dict]:
        if not settings.JHUB_API_KEY or not settings.JHUB_EMAIL:
            raise RuntimeError("JHUB_API_KEY and JHUB_EMAIL are not configured in .env")

        payload = {
            "apikey": settings.JHUB_API_KEY,
            "email": settings.JHUB_EMAIL,
            "fromdate": fromdate,
            "todate": todate,
        }

        response = requests.post(settings.JHUB_API_URL, data=payload, timeout=20)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, dict):
            # Be tolerant of APIs that wrap rows in a key.
            data = data.get("data") or data.get("results") or []
        if not isinstance(data, list):
            raise RuntimeError("Unexpected Conduit API response format")

        return [self._normalise(row) for row in data if isinstance(row, dict)]

    def fetch_latest_observations(self) -> dict:
        now = datetime.now(timezone.utc)
        rows = self.fetch(
            (now - timedelta(days=2)).date().isoformat(),
            now.date().isoformat(),
        )
        if not rows:
            raise RuntimeError("Conduit returned no observations for the requested period")

        return max(rows, key=lambda r: r.get("timestamp", ""))


conduit_service = ConduitService()
