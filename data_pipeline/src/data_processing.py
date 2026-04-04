import psycopg2
from psycopg2.extras import DictCursor
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Any


# --- 1. Fixed Dataclasses ---
@dataclass
class MeteoData:
    data_timestamp: datetime
    fk_wtg_id: str
    wind_speed_mean_5min: float
    etl_ts: datetime


@dataclass
class ParkData:
    datetime_current_value: datetime
    current_value: float
    tag_name: str
    etl_ts: datetime


@dataclass
class TurbineMetadata:
    pk_wtg_id: str
    fk_wtg_model_id: str
    fk_park_id: str
    fk_turbine_id: str
    lat_y: float
    long_x: float


parks: Dict[str, List[TurbineMetadata]] = {}
turbines: List[TurbineMetadata] = []


def fetch_and_set_turbines_data():
    global turbines, parks

    DB_CONFIG = {
        "dbname": "your_database_name",
        "user": "your_username",
        "password": "your_password",
        "host": "localhost",
        "port": "5432",
    }

    try:
        conn = psycopg2.connect(
            f"dbname={DB_CONFIG['dbname']} "
            f"user={DB_CONFIG['user']} "
            f"password={DB_CONFIG['password']} "
            f"host={DB_CONFIG['host']} "
            f"port={DB_CONFIG['port']}"
        )

        with conn.cursor(cursor_factory=DictCursor) as cur:
            cur.execute("""
                SELECT pk_wtg_id, fk_wtg_model_id, fk_park_id, 
                       fk_turbine_id, lat_y, long_x 
                FROM turbines;
            """)
            
            rows = cur.fetchall()

            for row in rows:
                turbine_obj = TurbineMetadata(
                    pk_wtg_id=row['pk_wtg_id'],
                    fk_wtg_model_id=row['fk_wtg_model_id'],
                    fk_park_id=row['fk_park_id'],
                    fk_turbine_id=row['fk_turbine_id'],
                    lat_y=float(row['lat_y']),
                    long_x=float(row['long_x'])
                )

                turbines.append(turbine_obj)

                if turbine_obj.fk_park_id not in parks:
                    parks[turbine_obj.fk_park_id] = []
                parks[turbine_obj.fk_park_id].append(turbine_obj)

        conn.close()
        print(f"Successfully synced {len(turbines)} turbines.")

    except Exception as e:
        print(f"Failed to fetch data: {e}")

def main():
    print("Initializing...")
    fetch_and_set_turbines_data()

    if parks:
        sample_park = list(parks.keys())[0]
        print(f"\nSample: Turbines in park '{sample_park}':")
        for t in parks[sample_park]:
            print(f" - ID: {t.fk_turbine_id} | Location: ({t.lat_y}, {t.long_x})")


if __name__ == "__main__":
    main()
