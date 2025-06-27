from pymongo import MongoClient

from my_ghost_writer.constants import MONGO_CONNECTION_STRING, DEFAULT_COLLECTION_THESAURUS, MONGO_CONNECTION_TIMEOUT


def get_database(db_name: str):
    # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
    client = MongoClient(MONGO_CONNECTION_STRING, timeoutMS=MONGO_CONNECTION_TIMEOUT)

    # Create the database for our example (we will use the same database throughout the tutorial
    return client[db_name]


def get_thesaurus_collection(collection_name: str = DEFAULT_COLLECTION_THESAURUS):
    dbname = get_database(db_name="thesaurus")
    return dbname[collection_name]
