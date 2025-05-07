import json

from asgi_correlation_id import CorrelationIdMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from my_ghost_writer.constants import ALLOWED_ORIGIN_LIST, DOMAIN, IS_TESTING, LOG_LEVEL, PORT, STATIC_FOLDER, app_logger
from my_ghost_writer.type_hints import RequestTextFrequencyBody


fastapi_title = "My Ghost Writer"
app = FastAPI(title=fastapi_title, version="1.0")
app_logger.info(f"allowed_origins:{ALLOWED_ORIGIN_LIST}...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGIN_LIST,
    allow_credentials=True,
    allow_methods=["GET", "POST"]
)


@app.middleware("http")
async def request_middleware(request, call_next):
    from my_ghost_writer.middlewares import logging_middleware

    return await logging_middleware(request, call_next)


@app.get("/health")
def health():
    from nltk import __version__ as nltk_version
    from fastapi import __version__ as fastapi_version
    app_logger.info(f"still alive... FastAPI version:{fastapi_version}, nltk version:{nltk_version}!")
    return "Still alive..."


@app.post("/words-frequency")
def get_words_frequency(body: RequestTextFrequencyBody | str) -> JSONResponse:
    from datetime import datetime
    from my_ghost_writer.text_parsers import text_stemming

    t0 = datetime.now()
    app_logger.info(f"body type: {type(body)}.")
    app_logger.debug(f"body: {body}.")
    body = json.loads(body)
    text = body["text"]
    app_logger.info(f"LOG_LEVEL: '{LOG_LEVEL}', length of text: {len(text)}.")
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


app.mount("/static", StaticFiles(directory=STATIC_FOLDER, html=True), name="static")

# add the CorrelationIdMiddleware AFTER the @app.middleware("http") decorated function to avoid missing request id
app.add_middleware(CorrelationIdMiddleware)


@app.get("/")
@app.get("/static/")
def index() -> FileResponse:
    return FileResponse(path=STATIC_FOLDER / "index.html", media_type="text/html")


if __name__ == "__main__":
    try:
        uvicorn.run("app:app", host=DOMAIN, port=PORT, reload=bool(IS_TESTING))
    except Exception as ex:
        print(f"fastapi/gradio application {fastapi_title}, exception:{ex}!")
        app_logger.exception(f"fastapi/gradio application {fastapi_title}, exception:{ex}!")
        raise ex
