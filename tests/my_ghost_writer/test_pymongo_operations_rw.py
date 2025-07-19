import unittest
from unittest.mock import patch, MagicMock
from my_ghost_writer import pymongo_operations_rw


class TestPymongoOperationsRW(unittest.TestCase):
    @patch('my_ghost_writer.pymongo_operations_rw.pymongo_utils.get_thesaurus_collection')
    def test_get_document_by_word_found(self, mock_get_collection):
        mock_collection = MagicMock()
        mock_collection.find_one.return_value = {"word": "example", "meaning": "test", "_id": "someid"}
        mock_get_collection.return_value = mock_collection

        result = pymongo_operations_rw.get_document_by_word("example")
        self.assertEqual(result, {"word": "example", "meaning": "test"})
        mock_collection.find_one.assert_called_with({"word": "example"})

    @patch('my_ghost_writer.pymongo_operations_rw.pymongo_utils.get_thesaurus_collection')
    def test_get_document_by_word_not_found(self, mock_get_collection):
        mock_collection = MagicMock()
        mock_collection.find_one.return_value = None
        mock_get_collection.return_value = mock_collection

        with self.assertRaises(AssertionError):
            try:
                pymongo_operations_rw.get_document_by_word("notfound")
            except AssertionError as ae:
                self.assertEqual(str(ae), "word 'notfound' not found in thesaurus collection")
                raise ae

    @patch('my_ghost_writer.pymongo_operations_rw.app_logger')
    @patch('my_ghost_writer.pymongo_operations_rw.pymongo_utils.get_thesaurus_collection')
    def test_insert_document_success(self, mock_get_collection, mock_logger):
        mock_collection = MagicMock()
        mock_result = MagicMock()
        mock_result.inserted_id = "someid"
        mock_collection.insert_one.return_value = mock_result
        mock_get_collection.return_value = mock_collection

        pymongo_operations_rw.insert_document({"word": "example"})
        mock_collection.insert_one.assert_called_with({"word": "example"})
        mock_logger.info.assert_called()

    @patch('my_ghost_writer.pymongo_operations_rw.app_logger')
    @patch('my_ghost_writer.pymongo_operations_rw.pymongo_utils.get_thesaurus_collection')
    def test_insert_document_failure(self, mock_get_collection, mock_logger):
        mock_collection = MagicMock()
        mock_result = MagicMock()
        mock_result.inserted_id = None
        mock_collection.insert_one.return_value = mock_result
        mock_get_collection.return_value = mock_collection

        with self.assertRaises(IOError):
            try:
                pymongo_operations_rw.insert_document({"word": "fail"})
            except IOError as e:
                self.assertEqual(str(e), """failed insert of document '{"word": "fail"}'""")
                raise e


if __name__ == '__main__':
    unittest.main()