import json
import unittest

from tests import EVENTS_FOLDER


def assert_get_synsets_by_word_and_language(cls, q):
    from my_ghost_writer.thesaurus import get_synsets_by_word_and_language

    response = get_synsets_by_word_and_language(q, lang="eng")
    cls.assertEqual(list(response.keys()), ['word', 'results'])
    cls.assertEqual(response["word"], q)
    cls.assertIsInstance(response["results"], list)
    results = response["results"]
    for result in results:
        for k, v in result.items():
            cls.assertIsInstance(k, str)
            try:
                if k == "definition":
                    cls.assertIsInstance(v, str)
                else:
                    cls.assertIsInstance(v, list)
            except AssertionError as ae:
                print(k, v, ae)
            for s in v:
                cls.assertIsInstance(s, str)
    with open(EVENTS_FOLDER / f"expected_get_synsets_by_word_and_language_{q}.json", "r") as src:
        # json.dump(response, src)
        expected_response = json.load(src)
        cls.assertEqual(response, expected_response)


class TestThesaurusWordnet(unittest.TestCase):
    def test_get_current_info_wordnet(self):
        from my_ghost_writer.thesaurus import get_current_info_wordnet

        current_info = get_current_info_wordnet()
        self.assertEqual(list(current_info.keys()), ['languages', 'version'])
        languages = current_info["languages"]
        self.assertIn("eng", languages)
        self.assertIsInstance(languages, list)
        self.assertIsInstance(current_info["version"], str)
        self.assertGreaterEqual(len(languages), 1)

    def test_get_synsets_by_word_and_language(self):
        assert_get_synsets_by_word_and_language(self, "dog")
        assert_get_synsets_by_word_and_language(self, "look")
        assert_get_synsets_by_word_and_language(self, "power")
        assert_get_synsets_by_word_and_language(self, "term")
