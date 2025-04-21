from pydantic import BaseModel


class RequestWordQueryBody(BaseModel):
    word: str


class RequestTextFrequencyBody(BaseModel):
    text: str