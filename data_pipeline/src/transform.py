import pandas as pd
import numpy as np
from sqlalchemy import create_engine, MetaData, Table, Column, String, Float, text, inspect
from src.config import S3_BASE_PATH, boto3_session, DB_URL
from src.extract import get_last_timestamp
import awswrangler as wr
import os
import concurrent.futures

engine = create_engine(DB_URL)

def process_single_file(file_path, data_type, engine):
	try:
		df = wr.s3.read_parquet(path=file_path, boto3_session=boto3_session)
		
		if df.empty:
			# FIX: Must return 3 values to match the unpacker
			return file_path, 0, None 

		ts_col = 'datetime_current_value' if data_type == 'park' else 'data_timestamp'
		df[ts_col] = pd.to_datetime(df[ts_col], unit='ms', utc=True).dt.tz_localize(None)
		df['timestamp'] = df[ts_col] # Ensure consistency for chunkers
		
		if data_type == 'park':
			count, max_ts = process_park_chunk(df, engine)
		else:
			count, max_ts = process_meteo_chunk(df, engine)
			
		return file_path, count, max_ts 
	except Exception as e:
		print(f"!!! CRITICAL THREAD ERROR for {file_path}: {e}")
		# FIX: Must return 3 values
		return None, 0, None
	
def ensure_audit_table(engine):
	query = text("""
		CREATE TABLE IF NOT EXISTS etl_audit_log (
			file_path TEXT PRIMARY KEY,
			data_type VARCHAR(50),
			max_timestamp TIMESTAMP,
			row_count INT,
			processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Add this back
		);
	""")
	with engine.begin() as conn:
		conn.execute(query)

def run_chunked_etl(data_type, engine, boto3_session, S3_BASE_PATH):
	path = f"{S3_BASE_PATH}/hackathon_{data_type}_data/"
	ensure_audit_table(engine)
	# 1. Get processed list from DB
	processed_files = get_processed_files_from_db(engine, data_type)
	
	all_files = wr.s3.list_objects(path, suffix=".parquet", boto3_session=boto3_session)
	new_files = [f for f in all_files if f not in processed_files]
	
	if not new_files:
		print(f"No new files for {data_type}.")
		return

	with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
		future_to_file = {
			executor.submit(process_single_file, f, data_type, engine): f 
			for f in new_files
		}

		for i, future in enumerate(concurrent.futures.as_completed(future_to_file)):
			try:
				# If this line fails, the code skips the log_processed_file_to_db call
				result_path, count, max_ts = future.result()
				
				if result_path:
					log_processed_file_to_db(engine, result_path, data_type, count, max_ts)
					print(f"Successfully logged {result_path}") # Debug print
				
			except Exception as e:
				print(f"Error retrieving future result: {e}")

def process_park_chunk(df, engine):
	# 1. Format and Drop Duplicates
	# Added n=2 to ensure we only split into 3 parts even if sensor names have dots
	df[['park_id', 'turbine_id', 'sensor_type']] = df['tag_name'].str.split('.', expand=True, n=2)
	df['timestamp'] = pd.to_datetime(df['datetime_current_value'])
	df = df.drop_duplicates(subset=['timestamp', 'tag_name']).copy()

	# 2. THE SWAP LOGIC
	# Identify where wind speed is NULL
	wind_mask = (df['sensor_type'] == 'wd_spd')
	null_mask = df['current_value'].isna()
	
	if (wind_mask & null_mask).any():
		# Get the unique range of timestamps in this chunk to limit the SQL query
		min_ts, max_ts = df['timestamp'].min(), df['timestamp'].max()
		
		# 2. FETCH CORRESPONDING METEO DATA
		meteo_query = text("""
			SELECT timestamp, turbine_id, wind_speed_mean_5min 
			FROM meteo_readings 
			WHERE timestamp BETWEEN :start AND :end
		""")
		
		with engine.connect() as conn:
			df_meteo = pd.read_sql(meteo_query, conn, params={"start": min_ts, "end": max_ts})

		if not df_meteo.empty:
			# 3. MERGE AND PATCH
			df = pd.merge(df, df_meteo, on=['timestamp', 'turbine_id'], how='left')
			
			# Fill only the wind speed nulls with meteo values
			df.loc[wind_mask & null_mask, 'current_value'] = df['wind_speed_mean_5min']
			
			# Cleanup the temporary column
			df = df.drop(columns=['wind_speed_mean_5min'])

	# 2. Define the Sensor Group (The missing definition)
	temp_sensors = ['conv_t', 'gearbox_t', 'gen1_t', 'gen2_t', 'transformer_t', 'turbine_t']

	high_wind_times = df[(df['sensor_type'] == 'wd_spd') & (df['current_value'] > 6)]['timestamp'].unique()
	
	# Refined Power Mask
	is_neg_power = (df['sensor_type'] == 'act_pwt') & (df['current_value'] < 1)
	
	is_power_underperform = (df['sensor_type'] == 'act_pwt') & \
							(df['current_value'] <= 80) & \
							(df['timestamp'].isin(high_wind_times))

	# Combine them for the master mask
	is_power_fault = is_neg_power | is_power_underperform

	# 3. Create Specific Masks
	is_integer = np.isclose(df['current_value'] % 1, 0, atol=1e-8)
	
	# Wind logic
	is_bad_wind = (df['sensor_type'] == 'wd_spd') & \
				  ((df['current_value'] < 0) | (df['current_value'] > 100))
	
	# Temp logic (Using the list defined above)
	is_bad_temp = (df['sensor_type'].isin(temp_sensors)) & \
				  ((df['current_value'] < -50) | (df['current_value'] > 150))

	# 4. Master Rejection Logic
	# Combine all bad conditions into one mask
	is_bad = is_integer | is_bad_wind | is_bad_temp | is_power_fault

	# Assign reasons (optional, but good for auditing)
	df['rejection_reason'] = 'None'
	df.loc[is_integer, 'rejection_reason'] = 'Integer Error'
	df.loc[is_bad_wind, 'rejection_reason'] = 'Wind Range Error'
	df.loc[is_bad_temp, 'rejection_reason'] = 'Temp Range Error'
	df.loc[is_power_fault, 'rejection_reason'] = 'Power Fault/Underperformance'
	# 5. Split and Save
	df_bad = df[is_bad].copy()
	df_good = df[~is_bad].copy()

	if not df_bad.empty:
		cols_to_remove = ['tag_name', 'datetime_current_value']
		df_bad = df_bad.drop(columns=[c for c in cols_to_remove if c in df_bad.columns])
		df_bad.to_sql('rejected_readings', con=engine, if_exists='append', index=False)

	max_ts = df['timestamp'].max()

	if not df_good.empty:
		# Resample logic
		df_res = (
			df_good.set_index('timestamp')
			.groupby(['park_id', 'turbine_id', 'sensor_type'])['current_value']
			.resample('15min').mean().reset_index()
			.dropna()
		)
		df_res.to_sql('sensor_readings', con=engine, if_exists='append', index=False)
		return len(df_res), max_ts
	
	return 0, max_ts

def process_meteo_chunk(df, engine):
	# 1. Standardize and Format
	df['timestamp'] = df['data_timestamp']
	df[['park_id', 'turbine_id']] = df['fk_wtg_id'].str.split('.', expand=True)
	
	# Ensure numeric and drop NaN before checking bounds
	df['wind_speed_mean_5min'] = pd.to_numeric(df['wind_speed_mean_5min'], errors='coerce')
	
	# --- DQ RULE: METEO BOUNDS & DEDUPLICATION ---
	df = df.drop_duplicates(subset=['timestamp', 'fk_wtg_id'])
	
	# Identify bad meteo data (e.g., negative wind or hurricane values > 150)
	is_bad = (df['wind_speed_mean_5min'] < 0) | (df['wind_speed_mean_5min'] > 150) | df['wind_speed_mean_5min'].isna()
	
	df_bad = df[is_bad].copy()
	df_good = df[~is_bad].copy()

	# 2. SAVE BAD METEO DATA
	if not df_bad.empty:
		df_bad['rejection_reason'] = 'Meteo out of bounds or Null'
		df_bad.to_sql('rejected_meteo', con=engine, if_exists='append', index=False)
		print(f"  [DQ-METEO] Logged {len(df_bad)} bad meteo rows.")

	# 3. PROCESS & SAVE GOOD METEO DATA
	max_ts = df['timestamp'].max()
	if not df_good.empty:
		df_m_res = (
			df_good.set_index('timestamp')
			.groupby(['park_id', 'turbine_id'])['wind_speed_mean_5min']
			.resample('15min').mean().reset_index()
		)
		
		# Append to the clean meteo table
		df_m_res.to_sql('meteo_readings', con=engine, if_exists='append', index=False)
		print(f"  [DQ-METEO] Appended {len(df_m_res)} valid meteo rows.")
		return len(df_m_res), max_ts
	
	return 0, max_ts

def get_processed_files_from_db(engine, data_type):
	"""Returns a set of files already processed for this data type."""
	query = text("SELECT file_path FROM etl_audit_log WHERE data_type = :dt")
	try:
		with engine.connect() as conn:
			result = conn.execute(query, {"dt": data_type})
			# result.all() or iteration both work fine here
			return {row[0] for row in result}
	except Exception as e:
		print(f"Warning: Could not fetch processed files: {e}")
		return set()

def log_processed_file_to_db(engine, file_path, data_type, row_count, max_ts):
	"""Inserts or updates the record in the audit table with the max timestamp."""
	query = text("""
		INSERT INTO etl_audit_log (file_path, data_type, row_count, max_timestamp)
		VALUES (:path, :dt, :count, :max_ts)
		ON CONFLICT (file_path) 
		DO UPDATE SET 
			row_count = EXCLUDED.row_count,
			max_timestamp = EXCLUDED.max_timestamp,
			processed_at = CURRENT_TIMESTAMP
	""")
	
	with engine.begin() as conn:
		conn.execute(query, {
			"path": file_path, 
			"dt": data_type, 
			"count": row_count, 
			"max_ts": max_ts
		})