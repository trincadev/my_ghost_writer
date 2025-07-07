import unittest
from unittest.mock import patch, MagicMock

from fastapi import HTTPException

from my_ghost_writer.text_parsers2 import extract_contextual_info_by_indices, get_wordnet_synonyms, inflect_synonym, \
    is_nlp_available, process_synonym_groups


class TestTextParsers2(unittest.TestCase):
    @patch("my_ghost_writer.text_parsers2.nlp", new=MagicMock())
    def test_is_nlp_available_ok(self):
        check = is_nlp_available()
        self.assertTrue(check)

    @patch("my_ghost_writer.text_parsers2.nlp", new=None)
    def test_is_nlp_available_fail(self):
        check = is_nlp_available()
        self.assertFalse(check)

    def test_extract_contextual_info_by_indices_valid(self):
        """Tests valid context extraction using the real spaCy model."""
        text = "The quick brown fox jumps over the lazy dog"
        start_idx, end_idx, target_word = 4, 9, "quick"

        result = extract_contextual_info_by_indices(text, start_idx, end_idx, target_word)

        self.assertEqual(result['word'], target_word)
        self.assertEqual(result['lemma'], "quick")
        self.assertEqual(result['pos'], "ADJ")
        self.assertEqual(result['tag'], "JJ")
        self.assertEqual(result['dependency'], "amod")
        self.assertEqual(result['context_sentence'], text)
        self.assertIn("context_words", result)
        self.assertEqual(result['char_start'], start_idx)
        self.assertEqual(result['char_end'], start_idx + len(target_word))

    def test_extract_contextual_info_by_indices_invalid_indices(self):
        """Tests that invalid indices raise a 400 HTTPException."""
        with self.assertRaises(HTTPException) as context:
            extract_contextual_info_by_indices("Test text that raises a 400 ", 100, 200, "test")

        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(context.exception.detail, "Invalid start/end indices")

    @patch("my_ghost_writer.text_parsers2.nlp", new=None)
    def test_extract_contextual_info_nlp_unavailable(self):
        """Tests that a 500 HTTPException is raised if spaCy model is not available."""
        with self.assertRaises(HTTPException) as context:
            extract_contextual_info_by_indices("text", 0, 4, "text")

        self.assertEqual(context.exception.status_code, 500)
        self.assertEqual(context.exception.detail, "spaCy model not available")

    def test_extract_contextual_info_word_mismatch(self):
        """Tests that a 400 HTTPException is raised for a word/index mismatch."""
        text = "The quick brown fox"
        # Indices point to "quick", but target_word is "brown"
        with self.assertRaises(HTTPException) as context:
            extract_contextual_info_by_indices(text, 4, 9, "brown")

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("Word mismatch", context.exception.detail)

    @patch("my_ghost_writer.text_parsers2.nlp")
    def test_extract_contextual_info_word_none(self, nlp_mock):
        nlp_mock.return_value = []
        text = "The quick brown fox jumps over the lazy dog"
        start_idx, end_idx, target_word = 4, 9, "quick"
        with self.assertRaises(HTTPException) as context:
            extract_contextual_info_by_indices(text, start_idx, end_idx, target_word)

        # 400 Exception intercepted and relaunched as 500
        self.assertEqual(context.exception.status_code, 500)
        self.assertIn("Error analyzing context: 400: Could not find token for word 'quick' at indices 4-9", context.exception.detail)

    def test_get_wordnet_synonyms(self):
        # Test with a word that has known synonyms
        word = "piano"
        synonyms = get_wordnet_synonyms(word)

        self.assertGreater(len(synonyms), 0)
        first_result = synonyms[0]
        self.assertIsInstance(first_result, dict)
        self.assertIn('definition', first_result)
        self.assertIn('examples', first_result)
        self.assertIn('pos', first_result)
        self.assertIn('synonyms', first_result)
        self.assertIsInstance(first_result['synonyms'], list)

    def test_get_wordnet_synonyms_pos_filter(self):
        # Test with POS filtering
        word = "hunt"
        synonyms_verbs = get_wordnet_synonyms(word, pos_tag="VERB")

        self.assertGreater(len(synonyms_verbs), 0)
        for sense in synonyms_verbs:
            self.assertEqual(sense['pos'], 'v')  # 'v' is the WordNet tag for VERB

    def test_inflect_synonym_noun_plural(self):
        # Test noun pluralization
        original_token_info = {'pos': 'NOUN', 'tag': 'NNS', 'is_lower': True, 'is_title': False, 'is_upper': False}
        # Test regular plural
        self.assertEqual(inflect_synonym("kid", original_token_info), "kids")
        # Test irregular plural
        self.assertEqual(inflect_synonym("child", original_token_info), "children")

    def test_inflect_synonym_verb_past1(self):
        # Test verb past tense
        original_token_info = {
            'word': 'looked', 'lemma': 'look', 'pos': 'VERB', 'tag': 'VBD', 'is_title': False, 'is_upper': False,
            'is_lower': True, 'dependency': 'ROOT',
            'context_sentence': 'He looked back at the whisperers as if he wanted to say something to them, but thought better of it.',
            'context_words': ['He', 'looked', 'back', 'at', 'the', 'whisperers', 'as'], 'sentence_position': 1,
            'char_start': 3, 'char_end': 9, 'original_indices': {'start': 3, 'end': 9}
        }
        result = inflect_synonym("write", original_token_info)
        self.assertEqual(result, "wrote")

    def test_inflect_synonym_verb_past2(self):
        """Tests verb past tense inflection (VBD)."""
        original_token_info = {'pos': 'VERB', 'tag': 'VBD', 'is_lower': True, 'is_title': False, 'is_upper': False}
        self.assertEqual(inflect_synonym("write", original_token_info), "wrote")
        self.assertEqual(inflect_synonym("look", original_token_info), "looked")

    def test_inflect_synonym_verb_present_participle(self):
        """Tests verb present participle inflection (VBG, e.g., 'writing')."""
        original_token_info = {'pos': 'VERB', 'tag': 'VBG', 'is_lower': True, 'is_title': False, 'is_upper': False}
        # Test with an irregular verb
        self.assertEqual(inflect_synonym("write", original_token_info), "writing")
        # Test with a regular verb
        self.assertEqual(inflect_synonym("look", original_token_info), "looking")

    def test_inflect_synonym_verb_third_person_singular(self):
        """Tests verb third-person singular inflection (VBZ, e.g., 'writes')."""
        original_token_info = {'pos': 'VERB', 'tag': 'VBZ', 'is_lower': True, 'is_title': False, 'is_upper': False}
        # Test with an irregular verb
        self.assertEqual(inflect_synonym("write", original_token_info), "writes")
        # Test with a regular verb
        self.assertEqual(inflect_synonym("look", original_token_info), "looks")


    def test_inflect_synonym_adjective_comparative(self):
        """Tests adjective comparative inflection (e.g., large -> larger) without mocks."""
        # Arrange: Create a complete context object for a comparative adjective
        original_token_info = {
            'word': 'bigger',
            'lemma': 'big',
            'pos': 'ADJ',
            'tag': 'JJR',  # JJR = Adjective, comparative
            'is_title': False,
            'is_upper': False,
            'is_lower': True,
            'dependency': 'acomp',
            'context_sentence': 'My house is bigger than yours.',
            'context_words': ['house', 'is', 'bigger', 'than', 'yours', '.'],
            'sentence_position': 3,
            'char_start': 12,
            'char_end': 18,
            'original_indices': {'start': 12, 'end': 18}
        }
        synonym_to_inflect = "large"

        # Act: Call the function with the synonym and context
        result = inflect_synonym(synonym_to_inflect, original_token_info)

        # Assert: Check that the synonym was correctly inflected
        self.assertEqual(result, "larger")

    def test_inflect_synonym_adjective_superlative(self):
        """Tests adjective superlative inflection (e.g., large -> largest) without mocks."""
        # Arrange: Create a complete context object for a superlative adjective
        original_token_info = {
            'word': 'greatest',
            'lemma': 'great',
            'pos': 'ADJ',
            'tag': 'JJS',  # JJS = Adjective, superlative
            'is_title': False,
            'is_upper': False,
            'is_lower': True,
            'dependency': 'amod',
            'context_sentence': 'He is the greatest of all time.',
            'context_words': ['is', 'the', 'greatest', 'of', 'all', 'time', '.'],
            'sentence_position': 3,
            'char_start': 10,
            'char_end': 18,
            'original_indices': {'start': 10, 'end': 18}
        }
        synonym_to_inflect = "large"

        # Act: Call the function with the synonym and context
        result = inflect_synonym(synonym_to_inflect, original_token_info)

        # Assert: Check that the synonym was correctly inflected
        self.assertEqual(result, "largest")

    def test_process_synonym_groups(self):
        """Tests the full processing pipeline for a verb."""
        word = "look"
        context_info = {'char_end': 9, 'char_start': 3,
        'context_sentence': 'He looked back at the whisperers as if he wanted to say something to them, but thought better of it.',
        'context_words': ['He', 'looked', 'back', 'at', 'the', 'whisperers', 'as'],
        'dependency': 'ROOT', 'is_lower': True, 'is_title': False, 'is_upper': False, 'lemma': 'look',
        'original_indices': {'end': 9, 'start': 3}, 'pos': 'VERB', 'sentence_position': 1, 'tag': 'VBD',
        'word': 'looked'}

        result = process_synonym_groups(word, context_info)

        # Assertions are flexible to avoid brittleness from library updates
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

        first_sense = result[0]
        self.assertIn('definition', first_sense)
        self.assertIn('synonyms', first_sense)

        first_synonym_info = first_sense['synonyms'][0]
        self.assertIn('base_form', first_synonym_info)
        self.assertIn('inflected_form', first_synonym_info)
        # For a past-tense verb, the inflected form should be different from the base
        self.assertNotEqual(first_synonym_info['base_form'], first_synonym_info['inflected_form'])


if __name__ == '__main__':
    unittest.main()
