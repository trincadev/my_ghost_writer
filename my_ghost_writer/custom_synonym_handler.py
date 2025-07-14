from typing import Any


class CustomSynonymHandler:
    def __init__(self):
        self.lexicon: dict[str, list[dict[str, Any]]] = {} # {word: {relation_type: [{word: related_word, definition: definition}]}}
        self.inverted_index: dict[str, set[str]] = {}  # For reverse lookups

    def add_entry(self, word: str, related: list[dict[str, Any]]):
        word = word.lower()
        self.lexicon[word] = {}
        for relation in related:
            relation_type = relation["type"]
            related_words = [{"word": w.lower(), "definition": relation.get("definition")} for w in relation["words"]]
            self.lexicon[word][relation_type] = related_words
            self._update_inverted_index(word, relation_type, related_words)

    def delete_entry(self, word: str):
        """Deletes a custom synonym entry if it exists."""
        word_lower = word.lower()
        if word_lower in self.lexicon:
            del self.lexicon[word_lower]
        else:
            raise KeyError(f"No custom synonyms found for word '{word}'.")

    def get_related(self, word: str, relation_type: str) -> list[dict[str, Any]]:
        word = word.lower()
        if word in self.lexicon and relation_type in self.lexicon[word]:
            return self.lexicon[word][relation_type]
        return []

    def reverse_lookup(self, related_word: str) -> set[str]:
        related_word = related_word.lower()
        if related_word in self.inverted_index:
            return self.inverted_index[related_word]
        return set()

    def _update_inverted_index(self, word: str, relation_type: str, related_words: list[dict[str, Any]]):
        """Updates the inverted index for reverse lookups."""
        for related in related_words:
            related_word = related["word"]
            if related_word not in self.inverted_index:
                self.inverted_index[related_word] = set()
            self.inverted_index[related_word].add(word)
