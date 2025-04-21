import json
import unittest

import nltk
from nltk.tokenize import wordpunct_tokenize, WordPunctTokenizer

from tests import EVENTS_FOLDER


class TestTextParsers(unittest.TestCase):
    def setUp(self):
        with open(EVENTS_FOLDER / "llm_generated_story_1.txt", "r") as src_text:
            text = src_text.read()
            self.text_split_newline = text.split("\n")

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

    def test_clean_word(self):
        from my_ghost_writer.text_parsers import clean_string

        self.maxDiff = None
        text_to_clean = """Hi there Mr. Tom, that's a text!\r\r I'm in need of ”punctuation”; """
        text_to_clean += """Can't you give me "stuff" (I think - or I hope - also)...\n\n Do you?"""
        words_tokens = wordpunct_tokenize(text_to_clean)
        offsets_tokens = WordPunctTokenizer().span_tokenize(text_to_clean)
        output = {
            "words_tokens": [],
            "offsets_tokens": []
        }
        for word, offsets in zip(words_tokens, offsets_tokens):
            cleaned_word = clean_string(word)
            output["words_tokens"].append(cleaned_word)
            output["offsets_tokens"].append(list(offsets))
        with open(EVENTS_FOLDER / "cleaned_words.json", "r") as src_json:
            expected_cleaned_words = json.load(src_json)
        self.assertDictEqual(output, expected_cleaned_words)

    def test_stemming(self):
        from my_ghost_writer.text_parsers import get_words_tokens_and_indexes
        words_stems_dict = get_words_tokens_and_indexes(self.row_words_tokens, self.row_offsets_tokens, self.ps)

        with open(EVENTS_FOLDER / "stem_words.json", "r") as dst_json:
            expected_words_stems_dict = json.load(dst_json)
        self.assertDictEqual(words_stems_dict, expected_words_stems_dict)


if __name__ == "__main__":
    unittest.main()
