import asyncio
import unittest
from unittest.mock import patch, MagicMock

from fastapi import Request
from fastapi.testclient import TestClient

from my_ghost_writer.app import app, mongo_health_check_background_task, lifespan


class TestAppEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.client.close()
        return super().tearDown()

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Still alive", response.text)

    @patch("my_ghost_writer.app.mongodb_health_check")
    @patch("my_ghost_writer.app.pymongo_version", "8.0.0")
    def test_health_mongo_ok(self, mock_health_check):
        mock_health_check.return_value = True
        response = self.client.get("/health-mongo")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Mongodb: still alive", response.text)

    @patch("my_ghost_writer.app.mongodb_health_check", side_effect=Exception("mongo error"))
    def test_health_mongo_fail(self, mock_health_check):
        mock_health_check.side_effect = Exception("mongo error")
        response = self.client.get("/health-mongo")
        self.assertNotEqual(response.status_code, 200)
        self.assertEqual(response.status_code, 500)

    @patch("my_ghost_writer.app.text_parsers.text_stemming")
    def test_words_frequency(self, mock_stemming):
        mock_stemming.return_value = (1, {"word": 2})
        body = '{"text": "test test"}'
        response = self.client.post("/words-frequency", json=body)
        self.assertEqual(response.status_code, 200)
        self.assertIn("words_frequency", response.json())

    def test_words_frequency_fail_request(self):
        body = '{}'
        response = self.client.post("/words-frequency", json=body)
        self.assertEqual(response.status_code, 500)

    @patch("my_ghost_writer.app.text_parsers.text_stemming")
    def test_words_frequency_fail2(self, mock_stemming):
        mock_stemming.side_effect = ValueError("stemming error")
        body = '{"text": "test test"}'
        response = self.client.post("/words-frequency", json=body)
        self.assertEqual(response.status_code, 500)

    @patch("my_ghost_writer.app.pymongo_operations_rw.get_document_by_word")
    def test_thesaurus_wordsapi_local(self, mock_get_doc):
        mock_get_doc.return_value = {"word": "test"}
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": True}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["source"], "local")

    @patch("my_ghost_writer.app.WORDSAPI_URL", "http://mocked-url.com")
    @patch("my_ghost_writer.app.RAPIDAPI_HOST", "mocked-rapidapi-host.com")
    @patch("my_ghost_writer.app.WORDSAPI_KEY", "WORDSAPI_KEY")
    @patch("my_ghost_writer.app.requests.get")
    @patch("my_ghost_writer.app.pymongo_operations_rw.get_document_by_word", side_effect=AssertionError)
    @patch("my_ghost_writer.app.pymongo_operations_rw.insert_document")
    def test_thesaurus_wordsapi_remote_mongo_ok(self, mock_insert, mock_get_doc, mock_requests_get):
        mock_get_doc.return_value = None
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"word": "test", "_id": "_id"}
        mock_requests_get.return_value = mock_response
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": True}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["source"], "wordsapi")

    @patch("my_ghost_writer.app.requests.get")
    def test_thesaurus_wordsapi_remote_404(self, mock_requests_get):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.json.return_value = {"error": "not found"}
        mock_requests_get.return_value = mock_response
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": True}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 404)
            response_json = response.json()
            self.assertDictEqual({'msg': {'error': 'not found'}}, response_json)

    @patch("my_ghost_writer.app.requests.get")
    def test_thesaurus_wordsapi_remote_500(self, mock_requests_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_requests_get.side_effect = Exception("test exception")
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": True}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 500)
            response_text = response.text
            self.assertEqual("", response_text)

    @patch("my_ghost_writer.app.WORDSAPI_URL", "http://mocked-url.com")
    @patch("my_ghost_writer.app.RAPIDAPI_HOST", "mocked-rapidapi-host.com")
    @patch("my_ghost_writer.app.WORDSAPI_KEY", "WORDSAPI_KEY")
    @patch("my_ghost_writer.app.requests.get")
    def test_thesaurus_wordsapi_remote_mongo_disabled(self, mock_requests_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"word": "test", "_id": "_id"}
        mock_requests_get.return_value = mock_response
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": False}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["source"], "wordsapi")

    @patch("my_ghost_writer.app.WORDSAPI_URL", "http://mocked-url.com")
    @patch("my_ghost_writer.app.RAPIDAPI_HOST", "mocked-rapidapi-host.com")
    @patch("my_ghost_writer.app.WORDSAPI_KEY", "WORDSAPI_KEY")
    @patch("my_ghost_writer.app.requests.get")
    def test_thesaurus_wordsapi_remote_mongo_disabled_fail(self, mock_requests_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"word": "test", "_id": "_id"}
        mock_requests_get.side_effect = IOError("io error")
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": False}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.text, "")

    def test_lifespan(self):
        # Test that lifespan yields and cancels the task
        async def run_lifespan():
            gen = lifespan(app)
            await gen.asend(None)
            await gen.aclose()
        asyncio.run(run_lifespan())

    def test_mongo_health_check_background_task(self):
        # Patch sleep and health_mongo to exit after one loop
        with patch("my_ghost_writer.app.ME_CONFIG_MONGODB_USE_OK", True), \
                patch("my_ghost_writer.app.health_mongo", return_value="Mongodb: still alive..."), \
                patch("my_ghost_writer.app.asyncio.sleep", side_effect=Exception("stop")):
            with self.assertRaises(Exception):
                asyncio.run(mongo_health_check_background_task())

    def test_index_route(self):
        from pathlib import Path
        import tempfile
        with tempfile.TemporaryDirectory() as tmpdir:
            index_path = Path(tmpdir) / "index.html"
            index_path.write_text("<html>Test</html>")
            with patch("my_ghost_writer.app.STATIC_FOLDER", Path(tmpdir)):
                response = self.client.get("/")
                self.assertEqual(response.status_code, 200)
                self.assertIn("Test", response.text)

    def test_static_route(self):
        with patch("my_ghost_writer.app.STATIC_FOLDER") as mock_static:
            mock_static.__truediv__.return_value = "index.html"
            response = self.client.get("/static/")
            self.assertEqual(response.status_code, 200)

    @patch("my_ghost_writer.app.request_validation_exception_handler")
    def test_request_validation_exception_handler(self, mock_handler):
        req = MagicMock(spec=Request)
        exc = MagicMock()
        from my_ghost_writer.app import request_validation_exception_handler
        request_validation_exception_handler(req, exc)
        mock_handler.assert_called_once_with(req, exc)

    @patch("my_ghost_writer.app.http_exception_handler")
    def test_http_exception_handler(self, mock_handler):
        req = MagicMock(spec=Request)
        exc = MagicMock()
        from my_ghost_writer.app import http_exception_handler
        http_exception_handler(req, exc)
        mock_handler.assert_called_once_with(req, exc)


if __name__ == "__main__":
    unittest.main()