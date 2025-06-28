from typing import TypedDict
from pydantic import BaseModel


class RequestWordQueryBody(BaseModel):
    word: str


class RequestTextFrequencyBody(BaseModel):
    text: str


class RequestQueryThesaurusWordsapiBody(BaseModel):
    query: str


class InputTextRow(TypedDict):
    """
    TypedDict for input text row.
    """
    idxRow: int
    text: str


class InputTextRowWithParent(InputTextRow, total=False):
    idxRowChild: int
    idxRowParent: int


class OffsetArray(TypedDict):
    """
    TypedDict for an offset array.
    """
    word: str
    offsets: list[int]
    n_row: int


class WordStem(TypedDict):
    """
    TypedDict for a word stem.
    """
    count: int
    word_prefix: str
    offsets_array: list[OffsetArray]


RequestTextRowsList = list[InputTextRow]
RequestTextRowsParentList = list[InputTextRowWithParent]
ResponseTextRowsDict = tuple[int, dict[str, WordStem]]
