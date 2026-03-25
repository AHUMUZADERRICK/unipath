import json
import os
from typing import Optional

import firebase_admin
from firebase_admin import credentials


def _build_credentials() -> Optional[credentials.Certificate]:
    credentials_file = os.getenv("FIREBASE_CREDENTIALS_FILE", "").strip()
    credentials_json = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()

    if credentials_file:
        if not os.path.exists(credentials_file):
            raise FileNotFoundError(f"Firebase credentials file not found: {credentials_file}")
        return credentials.Certificate(credentials_file)

    if credentials_json:
        info = json.loads(credentials_json)
        return credentials.Certificate(info)

    return None


def initialize_firebase() -> bool:
    if firebase_admin._apps:
        return True

    if os.getenv("USE_FIREBASE", "0") != "1":
        return False

    firebase_credentials = _build_credentials()
    if not firebase_credentials:
        return False

    options = {}
    project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
    if project_id:
        options["projectId"] = project_id

    firebase_admin.initialize_app(firebase_credentials, options or None)
    return True
