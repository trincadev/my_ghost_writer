import unittest

from my_ghost_writer.custom_synonym_handler import CustomSynonymHandler


class Test(unittest.TestCase):
    def test_custom_synonym_handler_add_entry_ok1(self):
        word_input = "happy"
        related_input = [
            {'definition': 'definition of happy', 'type': 'synonym', 'words': ['joy', 'cheer']},
            {'definition': 'definition of sad', 'type': 'antonym', 'words': ['sad', 'sadness']},
            {'definition': 'another definition of happy', 'type': 'synonym', 'words': ['content', 'cheerful', 'joyful']}
        ]
        test_custom_synonym_handler = CustomSynonymHandler()
        self.assertEqual(test_custom_synonym_handler.inverted_index, {})
        self.assertEqual(test_custom_synonym_handler.lexicon, {})

        test_custom_synonym_handler.add_entry(word_input, related_input)
        expected_lexicon = {
            "happy": {
                "synonym": [
                    {
                        "words": ["joy", "cheer"],
                        "definition": "definition of happy"
                    },
                    {
                        "words": ["content", "cheerful", "joyful"],
                        "definition": "another definition of happy"
                    }
                ],
                "antonym": [
                    {
                        "words": ["sad", "sadness"],
                        "definition": "definition of sad"
                    }
                ]
            }
        }
        expected_inverted_index = {
            "joy":      { "happy" },
            "cheer":    { "happy" },
            "sad":      { "happy" },
            "sadness":  { "happy" },
            "content":  { "happy" },
            "cheerful": { "happy" },
            "joyful":   { "happy" }
        }
        self.assertEqual(test_custom_synonym_handler.lexicon, expected_lexicon)
        self.assertEqual(test_custom_synonym_handler.inverted_index, expected_inverted_index)

        synonyms_related = test_custom_synonym_handler.get_related("happy", "synonym")
        self.assertListEqual(synonyms_related, [
            {'definition': 'definition of happy', 'words': ['joy', 'cheer']},
            {'definition': 'another definition of happy', 'words': ['content', 'cheerful', 'joyful']}
        ])
        antonyms_related = test_custom_synonym_handler.get_related("happy", "antonym")
        self.assertListEqual(antonyms_related, [{'definition': 'definition of sad', 'words': ['sad', 'sadness']}])

        test_custom_synonym_handler.add_entry("text", [
            {'definition': 'definition of text', 'type': 'synonym', 'words': ['word', 'sentence']}
        ])
        self.assertEqual(test_custom_synonym_handler.lexicon, {
            **{"text": {'synonym': [{'definition': 'definition of text', 'words': ['word', 'sentence']}]}},
            **expected_lexicon
        })
        self.assertEqual(test_custom_synonym_handler.inverted_index, {
            "word": {"text"}, "sentence": {"text"}, **expected_inverted_index
        })

        test_custom_synonym_handler.delete_entry("text")
        self.assertEqual(test_custom_synonym_handler.lexicon, expected_lexicon)
        self.assertEqual(test_custom_synonym_handler.inverted_index, expected_inverted_index)


if __name__ == '__main__':
    unittest.main()
