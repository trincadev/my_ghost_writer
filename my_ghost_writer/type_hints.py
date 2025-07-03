from typing import TypedDict, Optional
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


class ResultWordsAPI(TypedDict):
    definition: str
    synonyms: Optional[list[str]]
    typeOf: Optional[list[str]]
    hasTypes: Optional[list[str]]
    partOf: Optional[list[str]]
    hasParts: Optional[list[str]]
    antonyms: Optional[list[str]]
    derivation: Optional[list[str]]
    pertainsTo: Optional[list[str]]
    instanceOf: Optional[list[str]]
    hasInstances: Optional[list[str]]
    similarTo: Optional[list[str]]
    also: Optional[list[str]]
    entails: Optional[list[str]]
    hasSubstances: Optional[list[str]]
    inCategory: Optional[list[str]]
    usageOf: Optional[list[str]]
    causes: Optional[list[str]]
    verbGroups: Optional[list[str]]


class ResponseWordsAPI(TypedDict):
    word: str
    results: list[ResultWordsAPI]


RequestTextRowsList = list[InputTextRow]
RequestTextRowsParentList = list[InputTextRowWithParent]
ResponseTextRowsDict = tuple[int, dict[str, WordStem]]
#ResponseWordsAPI = dict[str, str | list[str]]
