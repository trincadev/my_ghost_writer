import json
import unittest

import nltk
from nltk.tokenize import wordpunct_tokenize, WordPunctTokenizer

from tests import EVENTS_FOLDER


def get_inputs_for(valid_textrows_with_num):
    row_words_tokens = []
    row_offsets_tokens = []
    idx_rows = []
    idx_rows_child = []
    idx_rows_parent = []
    rows_dict = {}
    for textrow in valid_textrows_with_num:
        row = textrow["text"]
        idx_row = textrow["idxRow"]
        rows_dict[idx_row] = row
        idx_rows.append(idx_row)
        try:
            idx_rows_child.append(textrow["idxRowChild"])
            idx_rows_parent.append(textrow["idxRowParent"])
        except KeyError:
            idx_rows_child.append(None)
            idx_rows_parent.append(None)
        row_words_tokens.append(wordpunct_tokenize(row))
        row_offsets_tokens.append(WordPunctTokenizer().span_tokenize(row))
    return row_words_tokens, row_offsets_tokens, idx_rows, idx_rows_child, idx_rows_parent, rows_dict


class TestTextParsers(unittest.TestCase):
    def setUp(self):
        with open(EVENTS_FOLDER / "get_words_tokens_and_indexes_inputs.json", "r") as src:
            self.get_words_tokens_and_indexes_inputs = json.load(src)
        with open(EVENTS_FOLDER / "request_text_stemming_no_parents.json", "r") as src:
            self.text_json_list_no_parents = json.load(src)
        with open(EVENTS_FOLDER / "request_text_stemming_with_parents.json", "r") as src:
            self.text_json_list_with_parents = json.load(src)
        with open(EVENTS_FOLDER / "llm_generated_story_3.txt", "r") as src:
            self.original_text = src.read()
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

    def test_text_stemming_text(self):
        from my_ghost_writer.text_parsers import text_stemming
        self.maxDiff = None
        n_total_rows, words_stems_dict = text_stemming(self.original_text)
        self.assertEqual(n_total_rows, len(self.text_split_newline))
        # with open(EVENTS_FOLDER / "response_text_stemming_from_llm_generated_story_3.json", "w") as dst_json:
        #     json.dump({"n_total_rows": n_total_rows, "words_stems_dict": words_stems_dict}, dst_json, indent=2)
        #     pass
        with open(EVENTS_FOLDER / "response_text_stemming_from_llm_generated_story_3.json", "r") as dst_json:
            response_text_stemming_from_llm_generated_story_3 = json.load(dst_json)
            expected_words_stems_dict = response_text_stemming_from_llm_generated_story_3["words_stems_dict"]
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_input_str_json(self):
        from my_ghost_writer.text_parsers import text_stemming
        self.maxDiff = None
        json_str = json.dumps(self.text_json_list_no_parents)
        n_total_rows, words_stems_dict = text_stemming(json_str)
        self.assertEqual(n_total_rows, len(self.text_json_list_no_parents))
        # with open(EVENTS_FOLDER / "response_text_stemming_empty_rows.json", "w") as dst_json:
        #     json.dump({"n_total_rows": n_total_rows, "words_stems_dict": words_stems_dict}, dst_json, indent=2)
        # pass
        with open(EVENTS_FOLDER / "response_text_stemming_empty_rows.json", "r") as dst_json:
            response_text_stemming_empty_rows = json.load(dst_json)
            expected_words_stems_dict = response_text_stemming_empty_rows["words_stems_dict"]
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_list_no_parents(self):
        from my_ghost_writer.text_parsers import text_stemming
        self.maxDiff = None
        n_total_rows, words_stems_dict = text_stemming(self.text_json_list_no_parents)
        self.assertEqual(n_total_rows, len(self.text_json_list_no_parents))
        # with open(EVENTS_FOLDER / "response_text_stemming_no_parents.json", "w") as dst_json:
        #     json.dump({"n_total_rows": n_total_rows, "words_stems_dict": words_stems_dict}, dst_json, indent=2)
        # pass
        with open(EVENTS_FOLDER / "response_text_stemming_no_parents.json", "r") as dst_json:
            response_text_stemming_no_parents = json.load(dst_json)
            expected_words_stems_dict = response_text_stemming_no_parents["words_stems_dict"]
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_list_with_parents(self):
        from my_ghost_writer.text_parsers import text_stemming
        self.maxDiff = None
        n_total_rows, words_stems_dict = text_stemming(self.text_json_list_with_parents, n=3)
        self.assertEqual(n_total_rows, len(self.text_json_list_with_parents))
        # with open(EVENTS_FOLDER / "response_text_stemming_with_parents.json", "w") as dst_json:
        #     json.dump({"n_total_rows": n_total_rows, "words_stems_dict": words_stems_dict}, dst_json, indent=2)
        # pass
        with open(EVENTS_FOLDER / "response_text_stemming_with_parents.json", "r") as dst_json:
            response_text_stemming_with_parents = json.load(dst_json)
            expected_words_stems_dict = response_text_stemming_with_parents["words_stems_dict"]
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_text_stemming_wrong_input(self):
        from my_ghost_writer.text_parsers import text_stemming
        with self.assertRaises(TypeError):
            try:
                text_stemming({"text": "This is a test."})
            except TypeError as e:
                self.assertEqual(str(e), "Invalid input type. Expected plain text str, json str or list of dictionaries, not '<class 'dict'>'.")
                raise e

    def test_update_stems_list(self):
        from my_ghost_writer.text_parsers import update_stems_list
        with open(EVENTS_FOLDER / "update_stem_list_inputs.json", "r") as src:
            test_args = json.load(src)
            test_args_inputs = test_args["input"]
            test_args_outputs = test_args["output"]
        for arg, expected in zip(test_args_inputs, test_args_outputs):
            n_row = arg['n_row']
            offsets = arg['offsets']
            word = arg['word']
            current_stem_tuple = arg['current_stem_tuple']
            n_row_child = arg["n_row_child"]
            n_row_parent = arg["n_row_parent"]
            expected_offsets_array = expected['offsets_array']
            expected_count = expected['count']
            count, word_offsets = update_stems_list(current_stem_tuple, word, offsets, n_row=n_row, n_row_child=n_row_child, n_row_parent=n_row_parent)
            self.assertEqual(count, expected_count)
            self.assertEqual(word_offsets, expected_offsets_array)


    def test_get_words_tokens_and_indexes_ngrams_no_parents(self):
        from my_ghost_writer.text_parsers import get_words_tokens_and_indexes_ngrams

        with open(EVENTS_FOLDER / "llm_generated_story_4.txt", "r") as src:
            text = src.read()
            valid_textrows_with_num = [{"idxRow": i, "text": row} for i, row in enumerate(text.split("\n"))]

        row_words_tokens, row_offsets_tokens, idx_rows, idx_rows_child, idx_rows_parent, rows_dict = get_inputs_for(
            valid_textrows_with_num
        )
        words_stems_dict = get_words_tokens_and_indexes_ngrams(
            row_words_tokens,
            row_offsets_tokens,
            idx_rows,
            idx_rows_child,
            idx_rows_parent,
            rows_dict=rows_dict,
            n=5
        )
        # with open(EVENTS_FOLDER / "response_get_words_tokens_and_indexes_ngrams_text4_n5.json", "w") as dst_json:
        #     json.dump({"words_stems_dict": words_stems_dict}, dst_json, indent=2)
        with open(EVENTS_FOLDER / "response_get_words_tokens_and_indexes_ngrams_text4_n5.json", "r") as dst_json:
            response_get_words_tokens_and_indexes_ngrams_text4_n5 = json.load(dst_json)
            expected_words_stems_dict = response_get_words_tokens_and_indexes_ngrams_text4_n5["words_stems_dict"]
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)

    def test_get_words_tokens_and_indexes_ngrams_with_parents(self):
        from my_ghost_writer.text_parsers import get_words_tokens_and_indexes_ngrams
        self.maxDiff = None
        row_words_tokens, row_offsets_tokens, idx_rows, idx_rows_child, idx_rows_parent, rows_dict = get_inputs_for(
            self.text_json_list_with_parents
        )
        words_stems_dict = get_words_tokens_and_indexes_ngrams(
            row_words_tokens,
            row_offsets_tokens,
            idx_rows,
            idx_rows_child,
            idx_rows_parent,
            rows_dict=rows_dict,
            n=3
        )
        with open(EVENTS_FOLDER / "response_text_stemming_with_parents.json", "r") as dst_json:
            response_text_stemming_with_parents = json.load(dst_json)
            expected_words_stems_dict = response_text_stemming_with_parents["words_stems_dict"]
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)


if __name__ == "__main__":
    unittest.main()
