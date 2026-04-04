import os
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_KEY_SECRET")
AWS_REGION = os.getenv("AWS_REGION")

S3_BASE_PATH = "s3://ppcro-rr-noprod-app00176-development-s3-2/RAW/streaming"

STORAGE_OPTIONS = {
    "key": AWS_ACCESS_KEY,
    "secret": AWS_SECRET_KEY,
    "client_kwargs": {"region_name": AWS_REGION}
}
