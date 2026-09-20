from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Juja Flood & Environmental Digital Twin"
    API_V1_STR: str = "/api/v1"

    # JHUB Conduit credentials: put real values in digital-twin/.env
    JHUB_API_URL: str = "https://conduit.jhubafrica.com/data.php"
    JHUB_API_KEY: str = ""
    JHUB_EMAIL: str = ""

    # Operational study area / data paths
    ROOT_DIR: Path = PROJECT_ROOT
    DATA_DIR: Path = PROJECT_ROOT / "data"
    RAW_DIR: Path = DATA_DIR / "raw"
    REFERENCE_DIR: Path = DATA_DIR / "reference"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    DERIVED_DIR: Path = DATA_DIR / "derived"


settings = Settings()
