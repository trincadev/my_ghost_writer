from datetime import time
import json
from time import sleep
from bson import json_util
from my_ghost_writer.constants import app_logger
from my_ghost_writer.pymongo_get_database import get_thesaurus_collection


def get_document_by_word(query: str) -> dict:
    collection = get_thesaurus_collection()
    output: dict = collection.find_one({"word": query})
    del output["_id"]
    return output


def insert_document(document: dict) -> None:
    collection = get_thesaurus_collection()
    result = collection.insert_one(document)
    print(result)
    try:
        assert result.inserted_id
    except AssertionError:
        dumped = json.dumps(document, default=str)
        msg = f"failed insert of document '{dumped}'"
        raise IOError(msg)
