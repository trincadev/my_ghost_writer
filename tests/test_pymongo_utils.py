import unittest
from unittest.mock import patch, MagicMock

from my_ghost_writer import pymongo_utils


class TestPymongoUtils(unittest.TestCase):
    @patch('my_ghost_writer.pymongo_utils.MongoClient')
    def test_get_client(self, mock_mongo_client):
        client = pymongo_utils.get_client()
        mock_mongo_client.assert_called_with(
            pymongo_utils.MONGO_CONNECTION_STRING,
            timeoutMS=pymongo_utils.MONGO_CONNECTION_TIMEOUT
        )
        self.assertEqual(client, mock_mongo_client.return_value)

    @patch('my_ghost_writer.pymongo_utils.get_client')
    def test_get_database(self, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        db = pymongo_utils.get_database('testdb')
        mock_get_client.assert_called_once()
        mock_client.__getitem__.assert_called_with('testdb')
        self.assertEqual(db, mock_client.__getitem__.return_value)

    @patch('my_ghost_writer.pymongo_utils.get_database')
    def test_get_thesaurus_collection(self, mock_get_database):
        mock_db = MagicMock()
        mock_get_database.return_value = mock_db
        collection = pymongo_utils.get_thesaurus_collection('testdb', 'testcol')
        mock_get_database.assert_called_with(db_name='testdb')
        mock_db.__getitem__.assert_called_with('testcol')
        self.assertEqual(collection, mock_db.__getitem__.return_value)

    @patch('my_ghost_writer.pymongo_utils.get_client')
    @patch('my_ghost_writer.pymongo_utils.app_logger')
    def test_mongodb_health_check(self, mock_logger, mock_get_client):
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_client.admin.command.return_value = {'ok': 1}
        mock_client.server_info.return_value = {'version': '8.0.0'}
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_client.__getitem__.return_value = mock_db
        mock_db.__getitem__.return_value = mock_collection
        mock_collection.find_one.return_value = {}

        result = pymongo_utils.mongodb_health_check('testdb', 'testcol')
        mock_client.admin.command.assert_called_with('ping', check=True)
        mock_client.server_info.assert_called_once()
        mock_db.__getitem__.assert_called_with('testcol')
        mock_collection.find_one.assert_called_once()
        self.assertTrue(result)
        mock_logger.info.assert_any_call("mongodb server_version:8.0.0!")
        mock_logger.info.assert_any_call("mongodb: still alive...")


if __name__ == '__main__':
    unittest.main()