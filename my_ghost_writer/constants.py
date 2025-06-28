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
N_WORDS_GRAM = int(os.getenv("N_WORDS_GRAM", 2))
WORDSAPI_KEY = os.getenv("WORDSAPI_KEY")
WORDSAPI_URL = os.getenv("WORDSAPI_URL", "https://wordsapiv1.p.rapidapi.com/words")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "wordsapiv1.p.rapidapi.com")
MONGO_USE_OK = bool(os.getenv("MONGO_USE_OK", ""))
MONGO_CONNECTION_STRING_LOCAL = "mongodb://localhost:27017"
MONGO_CONNECTION_STRING = os.getenv("MONGO_CONNECTION_STRING", MONGO_CONNECTION_STRING_LOCAL)
MONGO_CONNECTION_TIMEOUT_LOCAL = int(os.getenv("MONGO_CONNECTION_TIMEOUT_LOCAL", 200))
MONGO_CONNECTION_TIMEOUT_REMOTE = int(os.getenv("MONGO_CONNECTION_TIMEOUT_REMOTE", 3000))
MONGO_CONNECTION_TIMEOUT = int(os.getenv(
    "MONGO_CONNECTION_TIMEOUT",
    MONGO_CONNECTION_TIMEOUT_LOCAL if MONGO_CONNECTION_STRING == MONGO_CONNECTION_STRING_LOCAL else MONGO_CONNECTION_TIMEOUT_REMOTE
))
MONGO_HEALTHCHECK_SLEEP = int(os.getenv("MONGO_HEALTHCHECK_SLEEP", 900))
DEFAULT_DBNAME_THESAURUS = "thesaurus"
DEFAULT_COLLECTION_THESAURUS =os.getenv("DEFAULT_COLLECTION_THESAURUS", "wordsapi")
session_logger.setup_logging(json_logs=LOG_JSON_FORMAT, log_level=LOG_LEVEL)
app_logger = structlog.stdlib.get_logger(__name__)
