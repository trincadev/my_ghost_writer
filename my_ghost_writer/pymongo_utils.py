from pymongo import MongoClient
from pymongo.server_api import ServerApi

from my_ghost_writer.constants import DEFAULT_DBNAME_THESAURUS, ME_CONFIG_MONGODB_URL, DEFAULT_COLLECTION_THESAURUS, ME_CONFIG_MONGODB_TIMEOUT, app_logger


def get_client() -> MongoClient:
    client = MongoClient(ME_CONFIG_MONGODB_URL, timeoutMS=ME_CONFIG_MONGODB_TIMEOUT, server_api=ServerApi('1'))

    try:
        client.admin.command('ping', check=True)
        app_logger.info("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        app_logger.error(f"failed to connect to mongodb: {e}!")
        raise e

    return client


def get_database(db_name: str = DEFAULT_DBNAME_THESAURUS):
    client = get_client()
    return client[db_name]


def get_thesaurus_collection(db_name: str = DEFAULT_DBNAME_THESAURUS, collection_name: str = DEFAULT_COLLECTION_THESAURUS):
    dbname = get_database(db_name=db_name)
    return dbname[collection_name]


def mongodb_health_check(db_name: str = DEFAULT_DBNAME_THESAURUS, collection_name: str = DEFAULT_COLLECTION_THESAURUS) -> bool:
    client = get_client()
    server_info = client.server_info()
    server_version = server_info["version"]
    app_logger.info(f"mongodb server_version:{server_version}!")
    # Try a simple find operation
    db = client[db_name]
    collection = db[collection_name]
    collection.find_one()
    app_logger.info("mongodb: still alive...")
    return True
