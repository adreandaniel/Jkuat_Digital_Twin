import numpy as np
import rasterio

from ..config import settings


class HydrologyService:
    def __init__(self):
        self.acc_path = settings.PROCESSED_DIR / "flow_accumulation.tif"
        self.slope_path = settings.PROCESSED_DIR / "slope.tif"

    def runoff_coefficient(self, antecedent_3h_mm: float, base_c: float) -> float:
        saturation = 0.0
        if antecedent_3h_mm > 30:
            saturation = 0.25
        elif antecedent_3h_mm > 15:
            saturation = 0.15
        elif antecedent_3h_mm > 5:
            saturation = 0.05
        return round(float(np.clip(base_c + saturation, 0.20, 0.95)), 2)

    def screening_index(self, rainfall_mm: float, duration_hr: float,
                        antecedent_3h_mm: float, base_c: float):
        """Create a terrain/rainfall screening surface.

        This is NOT a 2-D hydraulic model. It combines flow accumulation and
        slope to identify cells that become increasingly plausible flood-prone
        locations as rainfall intensity rises.
        """
        if not self.acc_path.exists() or not self.slope_path.exists():
            raise FileNotFoundError("flow_accumulation.tif and slope.tif are required")

        with rasterio.open(self.acc_path) as acc_src, rasterio.open(self.slope_path) as slope_src:
            acc = acc_src.read(1, masked=True).astype("float32")
            slope = slope_src.read(1, masked=True).astype("float32")

            valid = (~acc.mask) & (~slope.mask) & np.isfinite(acc) & np.isfinite(slope)
            accv = np.asarray(acc)[valid]
            slopev = np.asarray(slope)[valid]
            if accv.size == 0:
                raise RuntimeError("No valid hydrology cells found")

            # Log-transform accumulation because drainage concentration is highly skewed.
            logacc = np.log1p(np.maximum(accv, 0))
            wetness = (logacc - np.percentile(logacc, 5)) / max(
                np.percentile(logacc, 99) - np.percentile(logacc, 5), 1e-6
            )
            wetness = np.clip(wetness, 0, 1)

            # Lower slopes generally favour local water retention relative to steep slopes.
            slope_factor = 1 - np.clip(slopev / 15.0, 0, 1)
            index = 0.70 * wetness + 0.30 * slope_factor

            intensity = rainfall_mm / max(duration_hr, 1e-6)
            rain_factor = float(np.clip((intensity - 10.0) / 90.0, 0, 1))
            threshold = float(np.clip(0.82 - 0.28 * rain_factor, 0.55, 0.82))

            return {
                "intensity_mm_hr": intensity,
                "runoff_coefficient": self.runoff_coefficient(antecedent_3h_mm, base_c),
                "threshold": threshold,
                "index": index,
                "valid_mask": valid,
            }


hydrology_service = HydrologyService()
