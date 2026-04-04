import pandas as pd
import numpy as np
from sqlalchemy import create_engine, MetaData, Table, Column, String, Float, text, inspect
from src.config import S3_BASE_PATH, boto3_session, DB_URL
from src.extract import get_last_timestamp
import awswrangler as wr
import os
import concurrent.futures

engine = create_engine(DB_URL)

def process_chunk_and_save(chunk, data_type, last_ts):
	"""Processes a small slice of data and appends it to SQL."""
	if chunk.empty:
		return

	ts_col = 'datetime_current_value' if data_type == 'park' else 'data_timestamp'
	
	# 1. Standardize Time and Strip Timezone
	chunk[ts_col] = pd.to_datetime(chunk[ts_col], unit='ms', utc=True).dt.tz_localize(None)

	# 2. Filter out old data based on the DB bookmark
	if last_ts:
		chunk = chunk[chunk[ts_col] > last_ts]
	
	if chunk.empty:
		return

	# 3. ETL Logic
	if data_type == 'park':
		chunk[['park_id', 'turbine_id', 'sensor_type']] = chunk['tag_name'].str.split('.', expand=True)
		chunk['timestamp'] = chunk['datetime_current_value']
		# Error cleaning
		chunk.loc[np.isclose(chunk['current_value'] % 1, 0, atol=1e-8), 'current_value'] = np.nan
		
		df_res = (
			chunk.set_index('timestamp')
			.groupby(['park_id', 'turbine_id', 'sensor_type'])['current_value']
			.resample('15min').mean().reset_index()
		)
		df_res.dropna(subset=['current_value']).to_sql('sensor_readings', con=engine, if_exists='append', index=False)
		print(f"  [PARK] Appended {len(df_res)} resampled rows.")

	elif data_type == 'meteo':
		chunk['timestamp'] = chunk['data_timestamp']
		chunk[['park_id', 'turbine_id']] = chunk['fk_wtg_id'].str.split('.', expand=True)
		chunk['wind_speed_mean_5min'] = pd.to_numeric(chunk['wind_speed_mean_5min'], errors='coerce')
		
		df_m_res = (
			chunk.set_index('timestamp')
			.groupby(['park_id', 'turbine_id'])['wind_speed_mean_5min']
			.resample('15min').mean().reset_index()
		)
		df_m_res.to_sql('meteo_readings', con=engine, if_exists='append', index=False)
		print(f"  [METEO] Appended {len(df_m_res)} resampled rows.")
	
LOG_FILE = "processed_files_log.txt"

def get_processed_files():
	"""Reads the log file to see which S3 paths we've already done."""
	if os.path.exists(LOG_FILE):
		with open(LOG_FILE, "r") as f:
			# Return as a set for lightning-fast lookup
			return set(line.strip() for line in f)
	return set()

def log_processed_file(file_path):
	"""Adds a finished file path to the log."""
	with open(LOG_FILE, "a") as f:
		f.write(file_path + "\n")

def process_single_file(file_path, data_type, engine):
	try:
		# 1. Read file with internal wrangler threading enabled
		df = wr.s3.read_parquet(
			path=file_path, 
			boto3_session=boto3_session, 
			use_threads=True
		)
		
		if df.empty:
			return file_path # Signal to log as processed

		# 2. Standardize Time
		ts_col = 'datetime_current_value' if data_type == 'park' else 'data_timestamp'
		df[ts_col] = pd.to_datetime(df[ts_col], unit='ms', utc=True).dt.tz_localize(None)
		
		# 3. Route to your existing DQ + Resample functions
		if data_type == 'park':
			process_park_chunk(df, engine)
		else:
			process_meteo_chunk(df, engine)
			
		return file_path # Success
	except Exception as e:
		print(f"Error processing {file_path}: {e}")
		return None

def run_chunked_etl(data_type, engine, boto3_session, S3_BASE_PATH):
	path = f"{S3_BASE_PATH}/hackathon_{data_type}_data/"
	
	# 1. Get processed list
	processed_files = get_processed_files()
	
	print(f"--- Checking for new {data_type} files ---")
	all_files = wr.s3.list_objects(path, suffix=".parquet", boto3_session=boto3_session)
	new_files = [f for f in all_files if f not in processed_files]
	
	if not new_files:
		print(f"No new files found for {data_type}. Skipping...")
		return

	print(f"Found {len(new_files)} new files. Starting parallel execution...")

	# 2. Parallelize using ThreadPoolExecutor
	# max_workers=10 is a safe starting point. 
	# If your DB is fast, you can try 15-20.
	with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
		# Create a list of 'Futures'
		future_to_file = {
			executor.submit(process_single_file, f, data_type, engine): f 
			for f in new_files
		}

		# 3. Collect results as they finish
		for i, future in enumerate(concurrent.futures.as_completed(future_to_file)):
			result_path = future.result()
			
			if result_path:
				# 4. Bookmark as finished immediately so we don't repeat on crash
				log_processed_file(result_path)
				
				# Update progress every 25 files to avoid console spam
				if (i + 1) % 25 == 0 or (i + 1) == len(new_files):
					print(f"  [{i+1}/{len(new_files)}] {data_type.upper()} batch progress updated.")

	print(f"--- {data_type.upper()} processing complete. ---")

def process_park_chunk(df, engine):
	# 1. Format and Drop Duplicates
	# Added n=2 to ensure we only split into 3 parts even if sensor names have dots
	df[['park_id', 'turbine_id', 'sensor_type']] = df['tag_name'].str.split('.', expand=True, n=2)
	df['timestamp'] = pd.to_datetime(df['datetime_current_value'])
	df = df.drop_duplicates(subset=['timestamp', 'tag_name']).copy()

	# 2. Define the Sensor Group (The missing definition)
	temp_sensors = ['conv_t', 'gearbox_t', 'gen1_t', 'gen2_t', 'transformer_t', 'turbine_t']

	high_wind_times = df[(df['sensor_type'] == 'wd_spd') & (df['current_value'] > 6)]['timestamp'].unique()
	
	# Refined Power Mask
	is_neg_power = (df['sensor_type'] == 'act_pwt') & (df['current_value'] < 1)
	
	is_power_underperform = (df['sensor_type'] == 'act_pwt') & \
							(df['current_value'] <= 100) & \
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
		df_bad.to_sql('rejected_readings', con=engine, if_exists='append', index=False)

	if not df_good.empty:
		# Resample logic
		df_res = (
			df_good.set_index('timestamp')
			.groupby(['park_id', 'turbine_id', 'sensor_type'])['current_value']
			.resample('15min').mean().reset_index()
			.dropna()
		)
		df_res.to_sql('sensor_readings', con=engine, if_exists='append', index=False)

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
	if not df_good.empty:
		df_m_res = (
			df_good.set_index('timestamp')
			.groupby(['park_id', 'turbine_id'])['wind_speed_mean_5min']
			.resample('15min').mean().reset_index()
		)
		
		# Append to the clean meteo table
		df_m_res.to_sql('meteo_readings', con=engine, if_exists='append', index=False)
		print(f"  [DQ-METEO] Appended {len(df_m_res)} valid meteo rows.")