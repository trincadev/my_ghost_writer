import json
import unittest

import nltk
from nltk.tokenize import wordpunct_tokenize, WordPunctTokenizer

from tests import EVENTS_FOLDER


class TestTextParsers(unittest.TestCase):
    def setUp(self):
        with open(EVENTS_FOLDER / "request_text_stemming.json", "r") as src_text:
            self.text_json_list = json.load(src_text)
        with open(EVENTS_FOLDER / "llm_generated_story_3.txt", "r") as src_text:
            self.original_text = src_text.read()
            self.text_split_newline = self.original_text.split("\n")

            self.row_words_tokens = []
            self.row_offsets_tokens = []
            for row in self.text_split_newline:
                self.row_words_tokens.append(wordpunct_tokenize(row))
                self.row_offsets_tokens.append(WordPunctTokenizer().span_tokenize(row))

            nltk.download("punkt")
            nltk.download('punkt_tab')
            nltk.download("wordnet")
            nltk.download("omw-1.4")
            nltk.download('averaged_perceptron_tagger_eng')

            self.ps = nltk.PorterStemmer()
            self.wnl = nltk.WordNetLemmatizer()

    def test_get_words_tokens_and_indexes(self):
        from my_ghost_writer.text_parsers import get_words_tokens_and_indexes
        input_idx_rows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        words_stems_dict = get_words_tokens_and_indexes(
            self.row_words_tokens, self.row_offsets_tokens, self.ps, input_idx_rows
        )

        with open(EVENTS_FOLDER / "response_text_stemming.json", "r") as dst_json:
            expected_words_stems_dict = json.load(dst_json)
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_text(self):
        from my_ghost_writer.text_parsers import text_stemming
        self.maxDiff = None
        n_total_rows, words_stems_dict = text_stemming(self.original_text)
        self.assertEqual(n_total_rows, len(self.text_split_newline))
        # with open(EVENTS_FOLDER / "response_text_stemming.json", "w") as dst_json:
        #     json.dump(words_stems_dict, dst_json, indent=2)
        with open(EVENTS_FOLDER / "response_text_stemming.json", "r") as dst_json:
            expected_words_stems_dict = json.load(dst_json)
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_json(self):
        from my_ghost_writer.text_parsers import text_stemming
        self.maxDiff = None
        json_str = json.dumps(self.text_json_list["text"])
        n_total_rows, words_stems_dict = text_stemming(json_str)
        self.assertEqual(n_total_rows, len(self.text_json_list["text"]))
        # with open(EVENTS_FOLDER / "response_text_stemming_empty_rows.json", "w") as dst_json:
        #     json.dump(words_stems_dict, dst_json, indent=2)
        with open(EVENTS_FOLDER / "response_text_stemming_empty_rows.json", "r") as dst_json:
            expected_words_stems_dict = json.load(dst_json)
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_list(self):
        from my_ghost_writer.text_parsers import text_stemming
        self.maxDiff = None
        n_total_rows, words_stems_dict = text_stemming(self.text_json_list["text"])
        self.assertEqual(n_total_rows, len(self.text_json_list["text"]))
        # with open(EVENTS_FOLDER / "response_text_stemming_empty_rows.json", "w") as dst_json:
        #     json.dump(words_stems_dict, dst_json, indent=2)
        with open(EVENTS_FOLDER / "response_text_stemming_empty_rows.json", "r") as dst_json:
            expected_words_stems_dict = json.load(dst_json)
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_wrong_input(self):
        from my_ghost_writer.text_parsers import text_stemming
        with self.assertRaises(TypeError):
            try:
                text_stemming({"text": "This is a test."})
            except TypeError as e:
                self.assertEqual(str(e), "Invalid input type. Expected json str or list of dictionaries, not '<class 'dict'>'.")
                raise e


    def test_update_stems_list(self):
        from my_ghost_writer.text_parsers import update_stems_list
        test_args = [
            {
                "count": 1,
                "expected_word_offsets": [
                    {'n_row': 0, 'offsets': [106, 109], 'word': 'She'}
                ],
                "n_row": 0,
                "offsets": [106, 109],
                "word": "She",
                "words_stems_dict_stem": {
                    "count": 0,
                    "offsets_array": [],
                    "word_prefix": "she",
                },
            },
            {
                "count": 2,
                "expected_word_offsets": [
                    {'n_row': 0, 'offsets': [106, 109], 'word': 'She'},
                    {'n_row': 0, 'offsets': [202, 205], 'word': 'she'}
                ],
                "n_row": 0,
                "offsets": [202, 205],
                "word": "she",
                "words_stems_dict_stem": {
                    "count": 1,
                    "offsets_array": [
                        {"n_row": 0, "offsets": [106, 109], "word": "She"}
                    ],
                    "word_prefix": "she",
                },
            },
            {
                "count": 3,
                "expected_word_offsets": [
                    {'n_row': 0, 'offsets': [106, 109], 'word': 'She'},
                    {'n_row': 0, 'offsets': [202, 205], 'word': 'she'},
                    {'n_row': 1, 'offsets': [3, 6], 'word': 'she'}
                ],
                "n_row": 1,
                "offsets": [3, 6],
                "word": "she",
                "words_stems_dict_stem": {
                    "count": 2,
                    "offsets_array": [
                        {'n_row': 0, 'offsets': [106, 109], 'word': 'She'},
                        {'n_row': 0, 'offsets': [202, 205], 'word': 'she'}
                    ],
                    "word_prefix": "she",
                },
            },
        ]
        for arg in test_args:
            n_row = arg['n_row']
            offsets = arg['offsets']
            word = arg['word']
            words_stems_dict_stem = arg['words_stems_dict_stem']
            expected_word_offsets = arg['expected_word_offsets']
            expected_count = arg['count']
            count, word_offsets = update_stems_list(words_stems_dict_stem, word, offsets, n_row=n_row)
            self.assertEqual(count, expected_count)
            self.assertEqual(word_offsets, expected_word_offsets)


if __name__ == "__main__":
    unittest.main()
