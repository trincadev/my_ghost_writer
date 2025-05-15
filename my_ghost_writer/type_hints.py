from pydantic import BaseModel


class RequestWordQueryBody(BaseModel):
    word: str


class RequestTextFrequencyBody(BaseModel):
    text: str


from typing import TypedDict


class InputTextRow(TypedDict):
    """
    TypedDict for input text row.
    """
    idxRow: int
    text: str


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
ResponseTextRowsDict = int, dict[str, WordStem]