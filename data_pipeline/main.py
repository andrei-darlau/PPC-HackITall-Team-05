from src.extract import load_wtg_metadata, load_data
from src.transform import process_chunk_and_save, run_chunked_etl
import pandas as pd
from sqlalchemy import create_engine
from src.config import DB_URL, boto3_session, S3_BASE_PATH


engine = create_engine(DB_URL)
def main():
    print("--- Starting Instant-Write ETL Cycle ---")
    
    try:
        # 2. Metadata: Usually small enough to replace entirely every run
        print("Refreshing Turbine Metadata...")
        df_wtg = load_wtg_metadata()
        df_wtg.drop_duplicates('turbine_id').to_sql(
            'turbine_metadata', 
            con=engine, 
            if_exists='replace', 
            index=False
        )
        print(f"Successfully updated {len(df_wtg)} turbines.")

        # 3. Process PARK (Sensor) data file-by-file
        # This will now print progress for every single file it finishes
        run_chunked_etl('park', engine, boto3_session, S3_BASE_PATH)

        # 4. Process METEO data file-by-file
        run_chunked_etl('meteo', engine, boto3_session, S3_BASE_PATH)

        print("--- All folders processed successfully ---")

    except Exception as e:
        print(f"!!! CRITICAL ERROR IN MAIN: {e}")


if __name__ == "__main__":
    main()