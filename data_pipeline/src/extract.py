import pandas as pd
import numpy as np
import awswrangler as wr
from sqlalchemy import create_engine, text
from src.config import S3_BASE_PATH, boto3_session, DB_URL
import concurrent.futures

# 1. Initialize Engine
engine = create_engine(DB_URL)

def get_last_timestamp(table_name):
    """Checks DB for the latest record to avoid duplicates."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT MAX(timestamp) FROM {table_name}"))
            val = result.scalar()
            return pd.to_datetime(val).tz_localize(None) if val else None
    except Exception:
        return None

def load_wtg_metadata():
    """Loads static metadata."""
    path = f"{S3_BASE_PATH}/hackathon_wtg_data/"
    df = wr.s3.read_parquet(path=path, dataset=True, boto3_session=boto3_session)
    df = df.rename(columns={
        'fk_wtg_model_id': 'wtg_model_id', 
        'fk_park_id': 'park_id', 
        'fk_turbine_id': 'turbine_id'
    })
    return df.drop(columns=['pk_wtg_id'], errors='ignore')

def load_data(data_type: str):
    """Reads all files in folder but filters out rows already in DB."""
    path = f"{S3_BASE_PATH}/hackathon_{data_type}_data/"
    table_name = 'sensor_readings' if data_type == 'park' else 'meteo_readings'
    
    # Get bookmark from DB
    last_ts = get_last_timestamp(table_name)
    
    print(f"Reading {data_type} files from S3...")
    # dataset=True handles multiple files in the folder automatically
    df = wr.s3.read_parquet(path=path, dataset=True, boto3_session=boto3_session)
    
    ts_col = 'datetime_current_value' if data_type == 'park' else 'data_timestamp'
    
    # Force timezone-naive for comparison
    df[ts_col] = pd.to_datetime(df[ts_col], unit='ms', utc=True).dt.tz_localize(None)

    if last_ts:
        df = df[df[ts_col] > last_ts]
    
    print(f"[{data_type.upper()}] Found {len(df)} new rows.")
    return df