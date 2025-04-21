import json
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from my_ghost_writer.constants import root_folder
from my_ghost_writer.type_hints import RequestTextFrequencyBody


load_dotenv()
DEBUG = os.getenv("DEBUG", "")
static_folder = root_folder / "static"
fastapi_title = "My Ghost Writer"
app = FastAPI(title=fastapi_title, version="1.0")


@app.get("/health")
def health():
    print("still alive...")
    return "Still alive..."


@app.post("/words-frequency")
def get_word_frequency(body: RequestTextFrequencyBody | str) -> JSONResponse:
    from datetime import datetime
    from nltk import PorterStemmer
    from nltk.tokenize import wordpunct_tokenize, WordPunctTokenizer
    from my_ghost_writer.text_parsers import get_words_tokens_and_indexes

    t0 = datetime.now()
    if len(body) < 30:
        print(f"body: {type(body)}, {body}.")
    body = json.loads(body)
    text = body["text"]
    if len(text) < 30:
        print(f"text from request: {text} ...")
    print(f"DEBUG: '{DEBUG}', length of text: {len(text)}.")
    ps = PorterStemmer()
    text_split_newline = text.split("\n")
    row_words_tokens = []
    row_offsets_tokens = []
    for row in text_split_newline:
        row_words_tokens.append(wordpunct_tokenize(row))
        row_offsets_tokens.append(WordPunctTokenizer().span_tokenize(row))
    words_stems_dict = get_words_tokens_and_indexes(row_words_tokens, row_offsets_tokens, ps)
    dumped = json.dumps(words_stems_dict)
    if DEBUG:
        print(f"dumped: {dumped} ...")
    t1 = datetime.now()
    duration = (t1 - t0).total_seconds()
    n_total_rows = len(text_split_newline)
    content = {'words_frequency': dumped, "duration": f"{duration:.3f}", "n_total_rows": n_total_rows}
    print(f"content: {content["duration"]}, {content["n_total_rows"]} ...")
    return JSONResponse(status_code=200, content=content)


app.mount("/static", StaticFiles(directory=static_folder, html=True), name="static")


@app.get("/")
@app.get("/static/")
def index() -> FileResponse:
    return FileResponse(path=static_folder / "index.html", media_type="text/html")


if __name__ == "__main__":
    try:
        uvicorn.run("app:app", host="0.0.0.0", port=7860, reload=bool(DEBUG))
    except Exception as ex:
        print(f"fastapi/gradio application {fastapi_title}, exception:{ex}!")
        raise ex
