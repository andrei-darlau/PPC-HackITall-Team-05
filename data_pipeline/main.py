from src.extract import load_wtg_metadata

def main():
    print("Starting Data Pipeline ETL...")

    try:
        wtg_df = load_wtg_metadata()

        print("\nConnected to S3 and loaded metadata!")
        print("Here are the first 5 rows:")
        print(wtg_df.head())

        print(f"\nColumns found: {list(wtg_df.columns)}")

    except Exception as e:
        print(f"\nError connecting or reading data: {e}")


if __name__ == "__main__":
    main()
