import asyncio
import http
import json
from datetime import datetime

import requests
import uvicorn
from asgi_correlation_id import CorrelationIdMiddleware
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pymongo import __version__ as pymongo_version
from pymongo.errors import PyMongoError

from my_ghost_writer import pymongo_operations_rw, exception_handlers
from my_ghost_writer.constants import (app_logger, ALLOWED_ORIGIN_LIST, API_MODE, DOMAIN, IS_TESTING, STATIC_FOLDER,
   WORDSAPI_KEY, WORDSAPI_URL, RAPIDAPI_HOST, ME_CONFIG_MONGODB_USE_OK, ME_CONFIG_MONGODB_HEALTHCHECK_SLEEP,
   STATIC_FOLDER_LITEKOBOLDAINET, LOG_LEVEL, PORT)
from my_ghost_writer.pymongo_utils import mongodb_health_check
from my_ghost_writer.text_parsers import text_stemming
from my_ghost_writer.type_hints import RequestTextFrequencyBody, RequestQueryThesaurusWordsapiBody


async def mongo_health_check_background_task():
    app_logger.info(f"starting task, ME_CONFIG_MONGODB_USE_OK:{ME_CONFIG_MONGODB_USE_OK}...")
    while ME_CONFIG_MONGODB_USE_OK:
        try:
            db_ok["mongo_ok"] = health_mongo() == "Mongodb: still alive..."
        except PyMongoError:
            db_ok["mongo_ok"] = False
        await asyncio.sleep(ME_CONFIG_MONGODB_HEALTHCHECK_SLEEP)


async def lifespan(app: FastAPI):
    task = asyncio.create_task(mongo_health_check_background_task())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


fastapi_title = "My Ghost Writer"
app = FastAPI(title=fastapi_title, version="1.0", lifespan=lifespan)
app_logger.info(f"allowed_origins:{ALLOWED_ORIGIN_LIST}, IS_TESTING:{IS_TESTING}, LOG_LEVEL:{LOG_LEVEL}!")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGIN_LIST,
    allow_credentials=True,
    allow_methods=["GET", "POST"]
)
db_ok = {"mongo_ok": ME_CONFIG_MONGODB_USE_OK}


@app.middleware("http")
async def request_middleware(request, call_next):
    from my_ghost_writer.middlewares import logging_middleware

    return await logging_middleware(request, call_next)


@app.get("/health")
def health():
    from nltk import __version__ as nltk_version
    from fastapi import __version__ as fastapi_version
    from my_ghost_writer.__version__ import __version__ as ghost_writer_version
    app_logger.info(
        f"still alive... FastAPI version:{fastapi_version}, nltk version:{nltk_version}, my-ghost-writer version:{ghost_writer_version}!")
    return "Still alive..."


@app.get("/health-mongo")
def health_mongo() -> str:
    app_logger.info(f"pymongo driver version:{pymongo_version}!")
    if ME_CONFIG_MONGODB_USE_OK:
        try:
            db_ok["mongo_ok"] = mongodb_health_check()
            return "Mongodb: still alive..."
        except PyMongoError as pme:
            app_logger.error(f"{type(pme)}, {pme}!")
            db_ok["mongo_ok"] = False
            raise HTTPException(status_code=503, detail=type(pme))
    return f"ME_CONFIG_MONGODB_USE_OK:{ME_CONFIG_MONGODB_USE_OK}..."


@app.post("/words-frequency")
def get_words_frequency(body: RequestTextFrequencyBody | str) -> JSONResponse:
    t0 = datetime.now()
    app_logger.info(f"body type: {type(body)}.")
    app_logger.info(f"body: {body}.")
    body_validated = RequestTextFrequencyBody.model_validate_json(body)
    text = body_validated.text
    app_logger.info(f"LOG_LEVEL: '{LOG_LEVEL}', length of text: {len(text)}, type of 'text':'{type(text)}'.")
    if len(text) < 100:
        app_logger.debug(f"text from request: {text} ...")
    n_total_rows, words_stems_dict = text_stemming(text)
    dumped = json.dumps(words_stems_dict)
    app_logger.debug(f"dumped: {dumped} ...")
    t1 = datetime.now()
    duration = (t1 - t0).total_seconds()
    content_response = {'words_frequency': dumped, "duration": f"{duration:.3f}", "n_total_rows": n_total_rows}
    app_logger.info(f"content_response: {content_response["duration"]}, {content_response["n_total_rows"]} ...")
    app_logger.debug(f"content_response: {content_response} ...")
    return JSONResponse(status_code=200, content=content_response)


@app.post("/thesaurus-wordsapi")
def get_thesaurus_wordsapi(body: RequestQueryThesaurusWordsapiBody | str) -> JSONResponse:
    t0 = datetime.now()
    app_logger.info(f"body type: {type(body)} => {body}.")
    body_validated = RequestQueryThesaurusWordsapiBody.model_validate_json(body)
    query = body_validated.query
    use_mongo: bool = db_ok["mongo_ok"]
    app_logger.info(f"query: {type(query)} => {query}, use mongo? {use_mongo}.")
    if use_mongo:
        try:
            response = pymongo_operations_rw.get_document_by_word(query=query)
            t1 = datetime.now()
            duration = (t1 - t0).total_seconds()
            app_logger.info(f"found local data, duration: {duration:.3f}s.")
            return JSONResponse(status_code=200, content={"duration": duration, "thesaurus": response, "source": "local"})
        except (PyMongoError, AssertionError) as pme:
            app_logger.info(f"{pme}! Let's try the remote service...")

    url = f"{WORDSAPI_URL}/{query}"
    app_logger.info(f"url: {type(url)} => {url}.")
    headers = {
        "x-rapidapi-key": WORDSAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }
    response = requests.get(url, headers=headers)
    t1 = datetime.now()
    duration = (t1 - t0).total_seconds()
    app_logger.info(f"response.status_code: {response.status_code}, duration: {duration:.3f}s.")
    msg = f"API response is not 200: '{response.status_code}', query={query}, url={url}, duration: {duration:.3f}s."
    try:
        assert response.status_code < 500, msg
        try:
            assert response.status_code < 400, msg
        except AssertionError:
            msg = response.json()
            app_logger.info(f"msg_404:{msg}.")
            return JSONResponse(status_code=response.status_code, content={"msg": msg})
        response_json = response.json()
        if use_mongo:
            app_logger.debug(f"use_mongo:{use_mongo}, inserting response '{response_json}' by query '{query}' on db...")
            pymongo_operations_rw.insert_document(response_json)
            del response_json["_id"]  # since we inserted the wordsapi response on mongodb now it have a bson _id object not serializable by default
        t2 = datetime.now()
        duration = (t2 - t1).total_seconds()
        app_logger.info(f"response_json: inserted json on local db, duration: {duration:.3f}s. ...")
        return JSONResponse(status_code=200,
                            content={"duration": duration, "thesaurus": response_json, "source": "wordsapi"})
    except AssertionError as ae500:
        app_logger.error(f"URL: query => {type(query)} {query}; url => {type(url)} {url}.")
        app_logger.error(f"headers type: {type(headers)}...")
        # app_logger.error(f"headers: {headers}...")
        app_logger.error("response:")
        app_logger.error(str(response))
        app_logger.error(str(ae500))
        msg = f"request with query '{query}' has response with status '{http.HTTPStatus(response.status_code).phrase}'"
        app_logger.error(f"type_msg:{type(msg)}, msg:{msg}.")
        raise HTTPException(status_code=response.status_code, detail=msg)


@app.exception_handler(RequestValidationError)
def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return exception_handlers.request_validation_exception_handler(request, exc)


@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return exception_handlers.http_exception_handler(request, exc)


try:
    app.mount("/static", StaticFiles(directory=STATIC_FOLDER, html=True), name="static")
except Exception as ex_mount_static:
    app_logger.error(
        f"Failed to mount static folder: {STATIC_FOLDER}, exception: {ex_mount_static}, API_MODE: {API_MODE}!")
    if not API_MODE:
        app_logger.exception(f"since API_MODE is {API_MODE} we will raise the exception!")
        raise ex_mount_static
try:
    app.mount("/lite.koboldai.net", StaticFiles(directory=STATIC_FOLDER_LITEKOBOLDAINET, html=True), name="lite.koboldai.net")
except Exception as ex_mount_static1:
    app_logger.error(
        f"Failed to mount static folder: {STATIC_FOLDER_LITEKOBOLDAINET}, exception: {ex_mount_static1}, API_MODE: {API_MODE}!")
    if not API_MODE:
        app_logger.exception(f"since API_MODE is {API_MODE} we will raise the exception!")
        raise ex_mount_static1

# add the CorrelationIdMiddleware AFTER the @app.middleware("http") decorated function to avoid missing request id
app.add_middleware(CorrelationIdMiddleware)

try:
    @app.get("/")
    @app.get("/static/")
    def index() -> FileResponse:
        return FileResponse(path=STATIC_FOLDER / "index.html", media_type="text/html")
except Exception as ex_route_main:
    app_logger.error(f"Failed to prepare the main route, exception: {ex_route_main}, API_MODE: {API_MODE}!")
    if not API_MODE:
        app_logger.exception(f"since API_MODE is {API_MODE} we will raise the exception!")
        raise ex_route_main


if __name__ == "__main__":
    try:
        app_logger.info(
            f"Starting fastapi/gradio application {fastapi_title}, run in api mode: {API_MODE} (no static folder and main route)...")
        uvicorn.run("my_ghost_writer.app:app", host=DOMAIN, port=PORT, reload=bool(IS_TESTING))
    except Exception as ex_run:
        print(f"fastapi/gradio application {fastapi_title}, exception:{ex_run}!")
        app_logger.exception(f"fastapi/gradio application {fastapi_title}, exception:{ex_run}!")
        # important env variables: ALLOWED_ORIGIN_LIST, API_MODE, DOMAIN, IS_TESTING, LOG_LEVEL, PORT, STATIC_FOLDER
        app_logger.error(f"ALLOWED_ORIGIN_LIST: '{ALLOWED_ORIGIN_LIST}'")
        app_logger.error(f"API_MODE: '{API_MODE}'")
        app_logger.error(f"DOMAIN: '{DOMAIN}'")
        app_logger.error(f"IS_TESTING: '{IS_TESTING}'")
        app_logger.error(f"LOG_LEVEL: '{LOG_LEVEL}'")
        app_logger.error(f"PORT: '{PORT}'")
        app_logger.error(f"STATIC_FOLDER: '{STATIC_FOLDER}'")
        raise ex_run
