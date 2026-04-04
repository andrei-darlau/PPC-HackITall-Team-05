import concurrent.futures
import awswrangler as wr
import pandas as pd
from src.config import S3_BASE_PATH, boto3_session


def _read_and_sanitize_parquet(file_path):
    df = wr.s3.read_parquet(path=file_path, boto3_session=boto3_session)

    time_columns = ['datetime_current_value', 'data_timestamp', 'etl_ts']

    for col in time_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], utc=True)
            df[col] = df[col].dt.tz_localize(None)

    return df


def load_wtg_metadata() -> pd.DataFrame:
    """Loads and cleans the static turbine metadata."""
    path = f"{S3_BASE_PATH}/hackathon_wtg_data/"
    print(f"Reading WTG metadata with awswrangler from {path}...")
    
    # Load the data
    df = wr.s3.read_parquet(path=path, dataset=True, boto3_session=boto3_session)
    
    # 1. Rename the foreign key columns
    df = df.rename(columns={
        'fk_wtg_model_id': 'wtg_model_id',
        'fk_park_id': 'park_id',
        'fk_turbine_id': 'turbine_id'
    })
    
    # 2. Drop the primary key column
    # Use errors='ignore' just in case the column is already missing
    df = df.drop(columns=['pk_wtg_id'], errors='ignore')
    
    return df

def load_data(data_type: str) -> pd.DataFrame:
    path = f"{S3_BASE_PATH}/hackathon_{data_type}_data/"
    print(f"Reading Sensor data from {path}")

    files = wr.s3.list_objects(path, suffix=".parquet", boto3_session=boto3_session)
    # limit for testing
    files = files[:10]

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        dfs = list(executor.map(_read_and_sanitize_parquet, files))

    return pd.concat(dfs, ignore_index=True)
