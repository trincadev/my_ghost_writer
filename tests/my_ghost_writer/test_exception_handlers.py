import pytest
from fastapi import HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from my_ghost_writer.exception_handlers import request_validation_exception_handler, http_exception_handler


class DummyRequest:
    def __init__(self):
        self.headers = {"x-test": "header"}
        self.query_params = {"q": "param"}
    @property
    def headers(self):
        return self._headers
    @headers.setter
    def headers(self, value):
        self._headers = value
    @property
    def query_params(self):
        return self._query_params
    @query_params.setter
    def query_params(self, value):
        self._query_params = value


def test_request_validation_exception_handler():
    request = DummyRequest()
    exc = RequestValidationError([{"loc": ["body", "field"], "msg": "field required", "type": "value_error.missing"}])
    exc.body = {"field": None}
    response = request_validation_exception_handler(request, exc)
    assert isinstance(response, JSONResponse)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.body
    assert b"Unprocessable Entity" in response.body

def test_http_exception_handler():
    request = DummyRequest()
    exc = HTTPException(status_code=400, detail="Bad request")
    response = http_exception_handler(request, exc)
    assert isinstance(response, JSONResponse)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.body
    assert b"Internal Server Error" in response.body


if __name__ == "__main__":
    pytest.main([__file__])
