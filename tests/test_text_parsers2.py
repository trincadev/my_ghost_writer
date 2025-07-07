import unittest
from unittest.mock import patch, MagicMock

from fastapi import HTTPException

from my_ghost_writer.text_parsers2 import extract_contextual_info_by_indices, get_wordnet_synonyms, inflect_synonym, \
    is_nlp_available, process_synonym_groups


class TestTextParsers2(unittest.TestCase):
    # Patch the 'nlp' object in the text_parsers2 module directly
    @patch("my_ghost_writer.text_parsers2.nlp", new=MagicMock())
    def test_is_nlp_available_ok(self):
        """
        Tests that is_nlp_available returns True when the nlp model is loaded.
        """
        # The patch ensures text_parsers2.nlp is a mock object (not None)
        check = is_nlp_available()
        self.assertTrue(check)

    # Patch 'nlp' to be None to simulate the model failing to load
    @patch("my_ghost_writer.text_parsers2.nlp", new=None)
    def test_is_nlp_available_fail(self):
        """
        Tests that is_nlp_available returns False when the nlp model is None.
        """
        # The patch ensures text_parsers2.nlp is None
        check = is_nlp_available()
        # The assertion should check for a False result
        self.assertFalse(check)

    def test_extract_contextual_info_by_indices_valid(self):
        # Create test text with known indices
        text = "The quick brown fox jumps over the lazy dog"
        start_idx = 4
        end_idx = 9
        target_word = "quick"
        
        # Mock spaCy model
        mock_nlp = MagicMock()
        mock_doc = MagicMock()
        mock_token = MagicMock()
        
        # Set up mock return values
        mock_nlp.return_value = mock_doc
        mock_doc.__iter__.return_value = [mock_token]
        mock_token.text = target_word
        mock_token.idx = start_idx
        mock_token.lemma_ = "quick"
        mock_token.pos_ = "ADJ"
        mock_token.tag_ = "JJ"
        mock_token.dep_ = "amod"
        mock_token.sent.text = "The quick brown fox jumps over the lazy dog"
        
        # Execute test
        result = extract_contextual_info_by_indices(text, start_idx, end_idx, target_word)
        
        # Verify results
        self.assertEqual(result['word'], target_word)
        self.assertEqual(result['lemma'], "quick")
        self.assertEqual(result['pos'], "ADJ")
        self.assertEqual(result['tag'], "JJ")
        self.assertEqual(result['dependency'], "amod")
        self.assertEqual(result['context_sentence'], "The quick brown fox jumps over the lazy dog")
        self.assertIn("context_words", result)
        self.assertEqual(result['char_start'], start_idx)
        self.assertEqual(result['char_end'], start_idx + len(target_word))

    def test_extract_contextual_info_by_indices_invalid_indices(self):
        # Test with invalid indices
        text = "Test text"
        start_idx = 100
        end_idx = 200
        target_word = "test"
        
        with self.assertRaises(HTTPException) as context:
            extract_contextual_info_by_indices(text, start_idx, end_idx, target_word)
        
        self.assertEqual(context.exception.status_code, 400)
        self.assertEqual(str(context.exception.detail), "Invalid start/end indices")

    def test_get_wordnet_synonyms(self):
        # Test with a word that has known synonyms
        word = "piano"
        synonyms = get_wordnet_synonyms(word)
        
        self.assertTrue(len(synonyms) > 0)
        for x in synonyms:
            self.assertIsInstance(x, dict)
        self.assertListEqual(synonyms, [
            {'definition': 'a keyboard instrument that is played by depressing keys that cause hammers to strike tuned strings and produce sounds',
             'examples': [], 'pos': 'n', 'synonyms': ['pianoforte', 'forte-piano']},
            {'definition': '(music) low loudness', 'examples': [], 'pos': 'n', 'synonyms': ['pianissimo']},
            {'definition': 'used chiefly as a direction or description in music', 'examples': ['the piano passages in the composition'], 'pos': 'a', 'synonyms': ['soft']},
            {'definition': 'used as a direction in music; to be played relatively softly', 'examples': [], 'pos': 'r', 'synonyms': ['softly']}
        ])

    def test_get_wordnet_synonyms_pos_filter(self):
        # Test with POS filtering
        word = "hunt"
        synonyms_verbs = get_wordnet_synonyms(word, pos_tag="VERB")
        
        self.assertTrue(len(synonyms_verbs) > 0)
        for x in synonyms_verbs:
            self.assertIsInstance(x, dict)
        self.assertListEqual(synonyms_verbs, [
            {'definition': 'pursue for food or sport (as of wild animals)',
             'examples': ['Goering often hunted wild boars in Poland', 'The dogs are running deer'],
             'pos': 'v', 'synonyms': ['run', 'hunt down', 'track down']},
            {'definition': 'pursue or chase relentlessly',
             'examples': ['The hunters traced the deer into the woods',
                          'the detectives hounded the suspect until they found him'],
             'pos': 'v', 'synonyms': ['hound', 'trace']}
        ])

    # def test_inflect_synonym_noun_plural(self):
    #     # Test noun pluralization
    #     original_token_info = {'word': 'kids', 'lemma': 'kid', 'pos': 'NOUN', 'tag': 'NNS', 'is_title': False, 'is_upper': False, 'is_lower': True, 'dependency': 'pobj', 'context_sentence': "This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with the kids.", 'context_words': ['want', 'Dudley', 'mixing', 'with', 'the', 'kids', '.'], 'sentence_position': 20, 'char_start': 103, 'char_end': 107, 'original_indices': {'start': 103, 'end': 107}}
    #     result = inflect_synonym("kid", original_token_info)
    #     self.assertEqual(result, "children")

    def test_inflect_synonym_verb_past(self):
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

    # def test_inflect_synonym_adjective_comparative(self):
    #     # Test adjective comparative
    #     original_token_info = {
    #         'pos': 'ADJ',
    #         'tag': 'JJR'
    #     }
    #     result = inflect_synonym("good", original_token_info)
    #     self.assertEqual(result, "better")

    def test_process_synonym_groups(self):
        # Test synonym processing
        word = "look"
        context_info = {'char_end': 9, 'char_start': 3, 'context_sentence': 'He looked back at the whisperers as if he wanted to say something to them, but thought better of it.', 'context_words': ['He', 'looked', 'back', 'at', 'the', 'whisperers', 'as'], 'dependency': 'ROOT', 'is_lower': True, 'is_title': False, 'is_upper': False, 'lemma': 'look', 'original_indices': {'end': 9, 'start': 3}, 'pos': 'VERB', 'sentence_position': 1, 'tag': 'VBD', 'word': 'looked'}
        
        result = process_synonym_groups(word, context_info)
        expected_processed = [
            {'definition': 'give a certain impression or have a certain outward aspect', 'examples': ['She seems to be sleeping', 'This appears to be a very difficult problem'], 'synonyms': [{'base_form': 'appear', 'inflected_form': 'appeared', 'matches_context': True}, {'base_form': 'seem', 'inflected_form': 'seemed', 'matches_context': True}], 'wordnet_pos': 'v'},
            {'definition': 'search or seek', 'examples': ['We looked all day and finally found the child in the forest', 'Look elsewhere for the perfect gift!'], 'synonyms': [{'base_form': 'search', 'inflected_form': 'searched', 'matches_context': True}], 'wordnet_pos': 'v'},
            {'definition': 'be oriented in a certain direction, often with respect to another reference point; be opposite to', 'examples': ['The house looks north', 'My backyard look onto the pond'], 'synonyms': [{'base_form': 'front', 'inflected_form': 'fronted', 'matches_context': True}, {'base_form': 'face', 'inflected_form': 'faced', 'matches_context': True}], 'wordnet_pos': 'v'},
            {'definition': 'take charge of or deal with', 'examples': ['Could you see about lunch?', 'I must attend to this matter'], 'synonyms': [{'base_form': 'attend', 'inflected_form': 'attended', 'matches_context': True}, {'base_form': 'take care', 'inflected_form': 'took', 'matches_context': True}, {'base_form': 'see', 'inflected_form': 'saw', 'matches_context': True}], 'wordnet_pos': 'v'},
            {'definition': 'look forward to the probable occurrence of', 'examples': ['We were expecting a visit from our relatives', 'She is looking to a promotion'], 'synonyms': [{'base_form': 'expect', 'inflected_form': 'expected', 'matches_context': True}, {'base_form': 'await', 'inflected_form': 'awaited', 'matches_context': True}, {'base_form': 'wait', 'inflected_form': 'waited', 'matches_context': True}], 'wordnet_pos': 'v'},
            {'definition': 'have faith or confidence in', 'examples': ['you can count on me to help you any time', 'Look to your friends for support'], 'synonyms': [{'base_form': 'count', 'inflected_form': 'counted', 'matches_context': True}, {'base_form': 'bet', 'inflected_form': 'betted', 'matches_context': True}, {'base_form': 'depend', 'inflected_form': 'depended', 'matches_context': True}, {'base_form': 'calculate', 'inflected_form': 'calculated', 'matches_context': True}, {'base_form': 'reckon', 'inflected_form': 'reckoned', 'matches_context': True}], 'wordnet_pos': 'v'}
        ]
        self.assertGreater(len(result), 0)
        self.assertListEqual(result, expected_processed)


if __name__ == '__main__':
    unittest.main()
