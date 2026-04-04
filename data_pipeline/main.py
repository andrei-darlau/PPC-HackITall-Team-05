from src.extract import load_wtg_metadata, load_data
from src.transform import process_and_load


def main():
    try:
        # static turbine data
        wtg_df = load_wtg_metadata()
        print(f"[LOADED] wtg metadata: {len(wtg_df)} lines.")

		# sensor readings
        sensors_df = load_data("park")
        print(f"[LOADED] sensor data: {len(sensors_df)} lines.")

        meteo_df = load_data("meteo")
        print(f"[LOADED] meteo data: {len(meteo_df)} lines.")

        final_df = process_and_load(df_sensors=sensors_df, df_meteo=meteo_df, df_wtg=wtg_df)

        print("\n[DONE]")
        print(f"Total lines: {len(final_df)}")

    except Exception as e:
        print(f"\n[ERROR]: {e}")


if __name__ == "__main__":
    main()
