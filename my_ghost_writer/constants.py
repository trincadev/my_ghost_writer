import os
from pathlib import Path
import structlog

from dotenv import load_dotenv
from my_ghost_writer import session_logger


load_dotenv()
PROJECT_ROOT_FOLDER = Path(__file__).parent.parent
STATIC_FOLDER = PROJECT_ROOT_FOLDER / "static"
STATIC_FOLDER = Path(os.getenv("STATIC_FOLDER", str(STATIC_FOLDER)))
DOMAIN=os.getenv("DOMAIN", "localhost")
PORT=int(os.getenv("PORT", 7860))
ALLOWED_ORIGIN_LIST = os.getenv('ALLOWED_ORIGIN', f'http://{DOMAIN}:{PORT}').split(",")
LOG_JSON_FORMAT = bool(os.getenv("LOG_JSON_FORMAT"))
IS_TESTING = bool(os.getenv('IS_TESTING', ""))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
API_MODE = bool(os.getenv("API_MODE", ""))
session_logger.setup_logging(json_logs=LOG_JSON_FORMAT, log_level=LOG_LEVEL)
app_logger = structlog.stdlib.get_logger(__name__)
