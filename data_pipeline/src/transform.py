import pandas as pd
import numpy as np
from sqlalchemy import create_engine, MetaData, Table, Column, String, Float, text, inspect
from src.config import DB_URL

engine = create_engine(DB_URL)
metadata = MetaData()

def process_and_load(df_sensors, df_meteo, df_wtg):
    # --- 1. CLEAN & PARSE SENSORS ---
    df_sensors[['park_id', 'turbine_id', 'sensor_type']] = df_sensors['tag_name'].str.split('.', expand=True)
    df_sensors['timestamp'] = pd.to_datetime(df_sensors['datetime_current_value'], unit='ms')

    is_error = np.isclose(df_sensors['current_value'] % 1, 0, atol=1e-8)
    df_sensors.loc[is_error, 'current_value'] = np.nan

    # --- 2. RESAMPLE SENSORS ---
    df_resampled = (
        df_sensors.set_index('timestamp')
        .groupby(['park_id', 'turbine_id', 'sensor_type'])['current_value']
        .resample('15min')
        .mean()
        .reset_index()
    )

    # --- 3. PROCESS & RESAMPLE METEO ---
    df_meteo['timestamp'] = pd.to_datetime(df_meteo['data_timestamp'], unit='ms')
    df_meteo['wind_speed_mean_5min'] = pd.to_numeric(df_meteo['wind_speed_mean_5min'], errors='coerce')
    df_meteo[['m_park', 'm_turb']] = df_meteo['fk_wtg_id'].str.split('.', expand=True)

    df_meteo_15m = (
        df_meteo.set_index('timestamp')
        .groupby(['m_park', 'm_turb'])['wind_speed_mean_5min']
        .resample('15min')
        .mean()
        .reset_index()
    )

    # --- 4. MERGE METEO FALLBACK ---
    df_final = pd.merge(
        df_resampled,
        df_meteo_15m,
        left_on=['timestamp', 'park_id', 'turbine_id'],
        right_on=['timestamp', 'm_park', 'm_turb'],
        how='left'
    )

    mask_wd = df_final['sensor_type'] == 'wd_spd'
    df_final.loc[mask_wd, 'current_value'] = df_final.loc[mask_wd, 'current_value'].fillna(df_final['wind_speed_mean_5min'])
    df_final = df_final.dropna(subset=['current_value'])
    df_final = df_final[['timestamp', 'park_id', 'turbine_id', 'sensor_type', 'current_value']]

    # --- 5. DATABASE LOADING (TRUE APPEND) ---

    # A. Append Sensor Readings
    df_final.to_sql('sensor_readings', con=engine, if_exists='append', index=False)

    # B. Append Meteo Readings
    df_meteo_export = df_meteo_15m.rename(columns={'m_park': 'park_id', 'm_turb': 'turbine_id'})
    df_meteo_export = df_meteo_export[['timestamp', 'park_id', 'turbine_id', 'wind_speed_mean_5min']]
    df_meteo_export.to_sql('meteo_readings', con=engine, if_exists='append', index=False)

    # C. Metadata (Primary Key logic)
    target_table = 'turbine_metadata'
    inspector = inspect(engine)
    
    # ONLY create the table if it doesn't exist. NO DROPPING.
    if not inspector.has_table(target_table):
        cols = [Column('turbine_id', String(255), primary_key=True)]
        for col_name, dtype in df_wtg.dtypes.items():
            if col_name == 'turbine_id': continue
            sql_type = Float if pd.api.types.is_numeric_dtype(dtype) else String(255)
            cols.append(Column(col_name, sql_type))
        
        Table(target_table, metadata, *cols)
        metadata.create_all(engine)
    
    # Try to append; if turbine_id exists, it ignores the duplicate
    try:
        df_wtg.drop_duplicates(subset=['turbine_id']).to_sql(
            target_table, con=engine, if_exists='append', index=False
        )
    except Exception:
        pass 

    # Verify counts in console
    print(f"Batch processed. Appended {len(df_final)} sensor rows and {len(df_meteo_export)} meteo rows.")
    return df_final