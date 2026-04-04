import pandas as pd
import numpy as np
from sqlalchemy import create_engine

from src.config import DB_URL

engine = create_engine(DB_URL)


def process_and_load(df_sensors, df_meteo, df_wtg):
    df_sensors[['park_id', 'turbine_id', 'sensor_type']] = df_sensors['tag_name'].str.split('.', expand=True)
    df_sensors['wtg_id'] = df_sensors['park_id'] + '.' + df_sensors['turbine_id']
    df_sensors['timestamp'] = pd.to_datetime(df_sensors['datetime_current_value'], unit='ms')

    is_error = np.isclose(df_sensors['current_value'] % 1, 0, atol=1e-8)
    df_sensors.loc[is_error, 'current_value'] = np.nan

    df_pivot = df_sensors.pivot_table(
        index=['timestamp', 'wtg_id', 'park_id', 'turbine_id'],
        columns='sensor_type',
        values='current_value',
        aggfunc='mean'
    ).reset_index()

    df_pivot.set_index('timestamp', inplace=True)

    df_15m = df_pivot.groupby(['wtg_id', 'park_id', 'turbine_id']).resample('15min').mean().reset_index()

    df_meteo['wind_speed_mean_5min'] = pd.to_numeric(df_meteo['wind_speed_mean_5min'], errors='coerce')
    df_meteo['timestamp'] = pd.to_datetime(df_meteo['data_timestamp'], unit='ms')
    df_meteo_15m = (
        df_meteo.set_index('timestamp')
        .groupby('fk_wtg_id')['wind_speed_mean_5min']
        .resample('15min')
        .mean()
        .reset_index()
    )

    df_final = pd.merge(
        df_15m,
        df_meteo_15m[['timestamp', 'fk_wtg_id', 'wind_speed_mean_5min']],
        left_on=['timestamp', 'wtg_id'],
        right_on=['timestamp', 'fk_wtg_id'],
        how='left'
    )

    if 'wd_spd' not in df_final.columns:
        df_final['wd_spd'] = np.nan

    df_final['wd_spd_final'] = df_final['wd_spd'].fillna(df_final['wind_speed_mean_5min'])
    df_final.drop(columns=['fk_wtg_id', 'wind_speed_mean_5min'], inplace=True, errors='ignore')

    print("KPI")
    if 'act_pwt' in df_final.columns:
        df_final['act_pwt_mw'] = df_final['act_pwt'] / 1000.0
        # 0.25 hours (15 minutes)
        df_final['production_mwh'] = df_final['act_pwt_mw'] * 0.25
    else:
        df_final['production_mwh'] = np.nan

    df_final.to_sql('fact_turbine_metrics_15m', con=engine, if_exists='append', index=False)

    df_wtg.to_sql('dim_turbine_metadata', con=engine, if_exists='replace', index=False)

    print("[DONE] processing and loading data into the database.")
    return df_final
