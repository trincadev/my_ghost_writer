import asyncio
import importlib
import unittest
from http.client import responses
from unittest.mock import patch, MagicMock

from fastapi import Request, HTTPException
from fastapi.testclient import TestClient
from pymongo.errors import PyMongoError
from spacy.symbols import EVENT

from my_ghost_writer.app import app, mongo_health_check_background_task, lifespan

# Import the module we want to test directly
from my_ghost_writer import __version__ as version_module
from my_ghost_writer.app import app, mongo_health_check_background_task, lifespan
from my_ghost_writer.constants import app_logger
from tests import EVENTS_FOLDER


# --- NEW TEST CLASS FOR VERSIONING ---
class TestVersion(unittest.TestCase):
    """
    Tests the version fallback mechanism.
    """
    @patch('importlib.metadata.version', side_effect=ImportError("Simulated package not found error"))
    def test_version_import_error_fallback(self, mock_metadata_version):
        """
        Tests that __version__ falls back to '1.0.0' when importlib.metadata.version fails.
        This is the correct way to test module-level import logic.
        """
        # 1. The patch is now active, making `importlib.metadata.version` raise an error.

        # 2. We force a reload of the version module. This re-runs the code inside
        #    __version__.py, triggering the `try...except` block.
        importlib.reload(version_module)

        # 3. We assert that the __version__ variable was set to the fallback value.
        self.assertEqual(version_module.__version__, "1.0.0")

        # 4. We can also assert that our mock was called, confirming the test worked as expected.
        mock_metadata_version.assert_called_once()

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

    @patch("my_ghost_writer.app.get_current_info_wordnet")
    def test_health_wordnet_success(self, mock_get_info):
        """NEW: Covers the success path for /health-wordnet."""
        mock_get_info.return_value = {"version": "3.1", "lang": "eng"}
        response = self.client.get("/health-wordnet")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"msg": {"version": "3.1", "lang": "eng"}})
        mock_get_info.assert_called_once_with(True)

    @patch("my_ghost_writer.app.get_current_info_wordnet", side_effect=Exception("WordNet Down"))
    def test_health_wordnet_failure(self, mock_get_info):
        """NEW: Covers the exception path for /health-wordnet."""
        response = self.client.get("/health-wordnet")
        self.assertEqual(response.status_code, 503)
        # This also implicitly tests the custom http_exception_handler
        self.assertEqual(response.json(), {"detail": responses[503]})

    # --- /health-mongo Endpoint ---
    @patch("my_ghost_writer.app.mongodb_health_check")
    def test_health_mongo_ok(self, mock_health_check):
        mock_health_check.return_value = True
        with patch("my_ghost_writer.app.ME_CONFIG_MONGODB_USE_OK", True):
            response = self.client.get("/health-mongo")
            self.assertEqual(response.status_code, 200)
            self.assertIn("Mongodb: still alive", response.text)

    @patch("my_ghost_writer.app.mongodb_health_check", side_effect=PyMongoError("DB connection error"))
    def test_health_mongo_fail(self, mock_health_check):
        """REFACTORED: Correctly tests for a 503 error and the custom handler response."""
        with patch("my_ghost_writer.app.ME_CONFIG_MONGODB_USE_OK", True):
            response = self.client.get("/health-mongo")
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.json(), {"detail": responses[503]})

    def test_health_mongo_when_db_is_disabled(self):
        """NEW: Covers the case where ME_CONFIG_MONGODB_USE_OK is False."""
        with patch("my_ghost_writer.app.ME_CONFIG_MONGODB_USE_OK", False):
            response = self.client.get("/health-mongo")
            self.assertEqual(response.status_code, 200)
            self.assertIn("ME_CONFIG_MONGODB_USE_OK:False", response.text)

    @patch("my_ghost_writer.app.text_parsers.text_stemming")
    def test_words_frequency_success(self, mock_stemming):
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
    def test_words_frequency_fail_stemming_error(self, mock_stemming):
        mock_stemming.side_effect = ValueError("stemming error")
        body = '{"text": "test test"}'
        response = self.client.post("/words-frequency", json=body)
        self.assertEqual(response.status_code, 500)

    @patch("my_ghost_writer.app.text_parsers.get_sentence_by_word")
    def test_split_text_success(self, mock_get_sentence):
        """NEW: Covers the success path for /split-text."""
        mock_get_sentence.return_value = ("The quick brown fox.", 4, 9)
        body = {"text": "The quick brown fox.", "word": "quick", "start": 4, "end": 9}
        response = self.client.post("/split-text", json=body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["sentence"], "The quick brown fox.")
        self.assertEqual(response.json()["start_in_sentence"], 4)

    @patch("my_ghost_writer.app.text_parsers.get_sentence_by_word", side_effect=ValueError("Parsing failed"))
    def test_split_text_failure(self, mock_get_sentence):
        """NEW: Covers the exception path for /split-text."""
        body = {"text": "Some text", "word": "word", "start": 0, "end": 4}
        response = self.client.post("/split-text", json=body)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json(), {"detail": responses[500]})

    @patch("my_ghost_writer.app.pymongo_operations_rw.get_document_by_word")
    def test_thesaurus_wordsapi_local_success(self, mock_get_doc):
        mock_get_doc.return_value = {"word": "test"}
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": True}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["source"], "local")

    @patch("my_ghost_writer.app.requests.get")
    @patch("my_ghost_writer.app.pymongo_operations_rw.get_document_by_word", side_effect=AssertionError)
    @patch("my_ghost_writer.app.pymongo_operations_rw.insert_document")
    def test_thesaurus_wordsapi_remote_success(self, mock_insert, mock_get_doc, mock_requests_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"word": "test", "_id": "_id"}
        mock_requests_get.return_value = mock_response
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": True}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["source"], "wordsapi")
            # Ensure _id was deleted before returning
            self.assertNotIn("_id", response.json()["thesaurus"])

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
            self.assertEqual(response.json(), {'msg': {'error': 'not found'}})

    @patch("my_ghost_writer.app.requests.get")
    def test_thesaurus_wordsapi_remote_5xx_error(self, mock_requests_get):
        """REFACTORED: Correctly tests for a 5xx error from the external API."""
        mock_response = MagicMock()
        mock_response.status_code = 502  # Bad Gateway
        mock_requests_get.return_value = mock_response
        with patch("my_ghost_writer.app.db_ok", {"mongo_ok": False}):
            body = '{"query": "test"}'
            response = self.client.post("/thesaurus-wordsapi", json=body)
            self.assertEqual(response.status_code, 502)
            self.assertEqual(response.json(), {"detail": responses[502]})

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

    # --- /thesaurus-inflated-phrase Endpoint ---
    def test_get_synonyms_for_phrase_success(self):
        """Tests the success case for /thesaurus-inflated-phrase."""
        # Load the expected response from JSON file
        import json
        with open(EVENTS_FOLDER / "response_thesaurus_phrase_inflated.json", "r") as f:
            expected_response = json.load(f)

        body = {
            "word": "rather severe-looking woman",
            "text": "Instead he was smiling at a rather severe-looking woman who was wearing square glasses exactly the shape of the markings the cat had had around its eyes.",
            "start": 28,
            "end": 55
        }
        response = self.client.post("/thesaurus-inflated-phrase", json=body)
        self.assertEqual(response.status_code, 200)
        json_response = response.json()
        self.assertEqual(json_response["success"], expected_response["success"])
        self.assertEqual(json_response["original_phrase"], expected_response["original_phrase"])
        self.assertEqual(json_response["original_indices"], expected_response["original_indices"])
        self.assertEqual(json_response["message"], expected_response["message"])
        # check only the first result
        self.assertEqual(json_response["results"][0], expected_response["results"][0])

    def test_get_synonyms_for_phrase_no_synonyms(self):
        """Tests the case where no synonyms are found for the phrase."""
        body = {
            "word": "some phrase",
            "text": "This is some phrase.",
            "start": 8,
            "end": 18
        }
        response = self.client.post("/thesaurus-inflated-phrase", json=body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "success": True,
            "original_phrase": "some phrase",
            "original_indices": {
                "start": 8,
                "end": 18
            },
            "results": [],
            "message": "No words with synonyms found in the selected phrase."
        })

    def test_get_synonyms_for_phrase_empty_response(self):
        """Tests the error handling for /thesaurus-inflated-phrase."""
        body = {
            "word": "some phrase",
            "text": "This is some phrase.",
            "start": 20,  # introduce an error: start > end
            "end": 18
        }
        response = self.client.post("/thesaurus-inflated-phrase", json=body)
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(
            response.json(),
            {'message': 'No words with synonyms found in the selected phrase.', 'original_indices': {'end': 18, 'start': 20}, 'original_phrase': 'some phrase', 'results': [], 'success': True}
        )

    def test_get_synonyms_for_phrase_error_validation(self):
        from http.client import responses
        response = self.client.post("/thesaurus-inflated-phrase", json={})
        self.assertEqual(response.status_code, 422)
        response_json = response.json()
        app_logger.info(f"responses_422:'{responses[422]}'")
        app_logger.info(f"response_json:'{response_json}'")
        try:
            self.assertIn("Unprocessable Entity", response_json["detail"])
        except AssertionError:
            self.assertIn("Unprocessable Content", response_json["detail"])

    @patch("my_ghost_writer.text_parsers2.nlp", new=None)
    def test_get_synonyms_for_phrase_error_nlp_none(self):
        body = {
            "word": "some phrase",
            "text": "This is some phrase.",
            "start": 8,  # introduce an error: start > end
            "end": 18
        }
        response = self.client.post("/thesaurus-inflated-phrase", json=body)
        self.assertEqual(response.status_code, 503)
        self.assertIn("Service Unavailable", response.json()["detail"])

    @patch("my_ghost_writer.text_parsers2.nlp")
    def test_get_synonyms_for_phrase_error_exception(self, nlp_mock):
        nlp_mock.side_effect = Exception("test error")
        body = {
            "word": "some phrase",
            "text": "This is some phrase.",
            "start": 8,  # introduce an error: start > end
            "end": 18
        }
        response = self.client.post("/thesaurus-inflated-phrase", json=body)
        self.assertEqual(response.status_code, 500)
        self.assertIn("Internal Server Error", response.json()["detail"])

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

    @patch("my_ghost_writer.app.health_mongo", side_effect=PyMongoError("DB is down"))
    def test_mongo_health_check_background_task_failure(self, mock_health_check):
        """NEW: Covers the failure path of the background health check task."""
        async def run_task_once():
            # Patch sleep to stop the loop after one iteration
            with patch("my_ghost_writer.app.asyncio.sleep", side_effect=asyncio.CancelledError):
                with patch("my_ghost_writer.app.ME_CONFIG_MONGODB_USE_OK", True):
                    with self.assertRaises(asyncio.CancelledError):
                        await mongo_health_check_background_task()

        # Run the task and check that db_ok was set to False
        from my_ghost_writer.app import db_ok
        db_ok["mongo_ok"] = True # Reset state before test
        asyncio.run(run_task_once())
        self.assertFalse(db_ok["mongo_ok"])

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

    def test_validation_error_handler_on_words_frequency(self):
        body = {}  # Missing the required 'text' field
        response = self.client.post("/words-frequency", json=body)
        self.assertEqual(response.status_code, 422)
        # This assertion checks that our custom handler is being used
        self.assertEqual(response.json(), {"detail": responses[422]})

    @patch("my_ghost_writer.app.get_current_info_wordnet", side_effect=HTTPException(status_code=503))
    def test_http_exception_handler_sets_cors_header(self, mock_get_info):
        allowed_origin = "http://localhost:3000"
        with patch("my_ghost_writer.app.ALLOWED_ORIGIN_LIST", [allowed_origin]):
            response = self.client.get("/health-wordnet", headers={"Origin": allowed_origin})
            self.assertEqual(response.status_code, 503)
            # Verify the CORS header is set by our custom handler
            self.assertEqual(response.headers["access-control-allow-origin"], allowed_origin)


if __name__ == '__main__':
    unittest.main()
