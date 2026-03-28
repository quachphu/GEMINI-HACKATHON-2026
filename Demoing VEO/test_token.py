import datetime
import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=API_KEY, http_options={"api_version": "v1alpha"})

try:
    now = datetime.datetime.now(tz=datetime.timezone.utc)
    config = types.AuthTokenConfig(
        uses=2,
        expire_time=now + datetime.timedelta(minutes=30),
        new_session_expire_time=now + datetime.timedelta(minutes=5)
    )
    token = client.auth_tokens.create(config=config)
    print("--- TOKEN INSPECTION ---")
    print(f"TYPE: {type(token)}")
    print(f"DIR: {dir(token)}")
    try:
        print(f"NAME ATTR: {token.name}")
    except:
        print("NAME ATTR MISSING")
    
    # Try to serialize to see the keys
    try:
        # Some SDK objects have a to_json or similar
        print(f"DICT: {token.__dict__}")
    except:
        print("DICT ACCESS FAILED")

except Exception as e:
    print(f"ERROR: {e}")
