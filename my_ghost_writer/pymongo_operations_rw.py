import json
from my_ghost_writer import pymongo_utils
from my_ghost_writer.constants import app_logger


def get_document_by_word(query: str) -> dict:
    collection = pymongo_utils.get_thesaurus_collection()
    output: dict = collection.find_one({"word": query})
    assert output, f"not found document with query '{query}'..."
    del output["_id"]
    return output


def insert_document(document: dict) -> None:
    collection = pymongo_utils.get_thesaurus_collection()
    result = collection.insert_one(document)
    app_logger.info(f"result:{result}.")
    try:
        assert result.inserted_id
    except AssertionError:
        dumped = json.dumps(document, default=str)
        msg = f"failed insert of document '{dumped}'"
        raise IOError(msg)
