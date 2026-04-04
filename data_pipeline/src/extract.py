import pandas as pd
from src.config import S3_BASE_PATH, STORAGE_OPTIONS


def load_wtg_metadata() -> pd.DataFrame:
    """Loads the static turbine metadata."""
    path = f"{S3_BASE_PATH}/hackathon_wtg_data/"

    print(f"Reading WTG metadata from {path}...")
    df = pd.read_parquet(path, storage_options=STORAGE_OPTIONS)
    return df


def load_meteo_data(date_str: str) -> pd.DataFrame:
    """Loads meteo data for a specific day (assuming partitioned by date)."""
    path = f"{S3_BASE_PATH}/hackathon_meteo_data/"

    print(f"Reading Meteo data from {path}...")
    df = pd.read_parquet(path, storage_options=STORAGE_OPTIONS)
    return df


def load_sensor_data() -> pd.DataFrame:
    """Loads the sensor/park data."""
    path = f"{S3_BASE_PATH}/hackathon_park_data/"  #

    print(f"Reading Sensor data from {path}...")
    df = pd.read_parquet(path, storage_options=STORAGE_OPTIONS)
    return df
