import os
from pathlib import Path
import structlog

from dotenv import load_dotenv
from my_ghost_writer import session_logger


load_dotenv()
PROJECT_ROOT_FOLDER = Path(__file__).parent.parent
STATIC_FOLDER = PROJECT_ROOT_FOLDER / "static"
STATIC_FOLDER_LITEKOBOLDAINET = PROJECT_ROOT_FOLDER / "lite.koboldai.net"
STATIC_FOLDER = Path(os.getenv("STATIC_FOLDER", str(STATIC_FOLDER)))
STATIC_FOLDER_LITEKOBOLDAINET = Path(os.getenv("STATIC_FOLDER_LITEKOBOLDAINET", str(STATIC_FOLDER_LITEKOBOLDAINET)))
DOMAIN=os.getenv("DOMAIN", "localhost")
PORT=int(os.getenv("PORT", 7860))
ALLOWED_ORIGIN_LIST = [o.strip() for o in os.getenv('ALLOWED_ORIGIN', f'http://{DOMAIN}:{PORT}').split(",")]
LOG_JSON_FORMAT = bool(os.getenv("LOG_JSON_FORMAT"))
IS_TESTING = bool(os.getenv('IS_TESTING', ""))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
API_MODE = bool(os.getenv("API_MODE", ""))
N_WORDS_GRAM = int(os.getenv("N_WORDS_GRAM", 2))
NLTK_DATA = os.getenv("NLTK_DATA", str(PROJECT_ROOT_FOLDER / "nltk_data"))
WORDNET_LANGUAGES=(os.getenv("WORDNET_LANGUAGES", "eng,"))
SPACY_MODEL_NAME=os.getenv("SPACY_MODEL_NAME", "en_core_web_sm")
WORDSAPI_KEY = os.getenv("WORDSAPI_KEY")
WORDSAPI_URL = os.getenv("WORDSAPI_URL", "https://wordsapiv1.p.rapidapi.com/words")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "wordsapiv1.p.rapidapi.com")
ME_CONFIG_MONGODB_USE_OK = bool(os.getenv("ME_CONFIG_MONGODB_USE_OK", ""))
ME_CONFIG_MONGODB_URL_LOCAL = "mongodb://localhost:27017"
ME_CONFIG_MONGODB_URL = os.getenv("ME_CONFIG_MONGODB_URL", ME_CONFIG_MONGODB_URL_LOCAL)
ME_CONFIG_MONGODB_TIMEOUT_LOCAL = int(os.getenv("ME_CONFIG_MONGODB_TIMEOUT_LOCAL", 200))
ME_CONFIG_MONGODB_TIMEOUT_REMOTE = int(os.getenv("ME_CONFIG_MONGODB_TIMEOUT_REMOTE", 3000))
ME_CONFIG_MONGODB_TIMEOUT = int(os.getenv(
    "ME_CONFIG_MONGODB_TIMEOUT",
    ME_CONFIG_MONGODB_TIMEOUT_LOCAL if ME_CONFIG_MONGODB_URL == ME_CONFIG_MONGODB_URL_LOCAL else ME_CONFIG_MONGODB_TIMEOUT_REMOTE
))
ME_CONFIG_MONGODB_HEALTHCHECK_SLEEP = int(os.getenv("ME_CONFIG_MONGODB_HEALTHCHECK_SLEEP", 900))
DEFAULT_COLLECTION_THESAURUS =os.getenv("DEFAULT_COLLECTION_THESAURUS", "wordsapi")
DEFAULT_DBNAME_THESAURUS = "thesaurus"
ELIGIBLE_POS = {'NOUN', 'PROPN', 'VERB', 'ADJ', 'ADV'}
session_logger.setup_logging(json_logs=LOG_JSON_FORMAT, log_level=LOG_LEVEL)
app_logger = structlog.stdlib.get_logger(__name__)
