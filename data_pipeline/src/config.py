import os
import urllib
from urllib.parse import quote_plus

import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_KEY_SECRET")
AWS_REGION = os.getenv("AWS_REGION")

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

S3_BASE_PATH = "s3://ppcro-rr-noprod-app00176-development-s3-2/RAW/streaming"

boto3_session = boto3.Session(
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

S3_STORAGE_OPTIONS = {
    "key": AWS_ACCESS_KEY,
    "secret": AWS_SECRET_KEY,
    "client_kwargs": {"region_name": AWS_REGION}
}

safe_password = quote_plus(DB_PASSWORD)

DB_URL = f"postgresql://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
