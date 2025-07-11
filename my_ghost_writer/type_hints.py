from typing import Any, TypedDict, Optional
from pydantic import BaseModel


class RequestWordQueryBody(BaseModel):
    word: str


class RequestTextFrequencyBody(BaseModel):
    text: str


class RequestQueryThesaurusWordsapiBody(BaseModel):
    query: str


class RequestSplitText(BaseModel):
    text: str
    end: int
    start: int
    word: str

class RequestQueryThesaurusInflatedBody(BaseModel):
    text: str
    end: int
    start: int
    word: str

class SynonymOption(BaseModel):
    base_form: str
    inflected_form: str
    matches_context: bool

class SynonymGroup(BaseModel):
    definition: str
    examples: list[str]
    wordnet_pos: str
    synonyms: list[SynonymOption]

class ContextInfo(BaseModel):
    pos: str
    sentence: str
    grammatical_form: str
    context_words: list[str]
    dependency: str

class SingleWordSynonymResponse(BaseModel):
    success: bool
    original_word: str
    original_indices: dict[str, int]
    context_info: ContextInfo
    synonym_groups: list[SynonymGroup]
    message: Optional[str] = None
    debug_info: Optional[dict[str, Any]] = None

class WordSynonymResult(BaseModel):
    original_word: str
    original_indices: dict[str, int]
    context_info: ContextInfo
    synonym_groups: list[SynonymGroup]
    debug_info: Optional[dict[str, Any]] = None

class MultiWordSynonymResponse(BaseModel):
    success: bool
    original_phrase: str
    original_indices: dict[str, int]
    results: list[WordSynonymResult]
    message: Optional[str] = None


class HealthCheckResponse(BaseModel):
    success: bool
    status: str
    spacy_available: bool


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
