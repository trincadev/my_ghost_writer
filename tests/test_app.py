import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from my_ghost_writer.app import app


class TestAppEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

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

    @patch("my_ghost_writer.app.text_stemming")
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

    @patch("my_ghost_writer.app.text_stemming")
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


if __name__ == "__main__":
    unittest.main()