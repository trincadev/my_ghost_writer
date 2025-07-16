from typing import Any


class CustomSynonymHandler:
    def __init__(self):
        # {word: {relation_type: [{word: related_word, definition: definition}]}}
        self.lexicon: dict[str, dict[str, list[dict[str, Any]]]] = {}
        # For reverse lookups
        self.inverted_index: dict[str, set[str]] = {}

    def add_entry(self, word: str, related: list[dict[str, Any]]):
        word = word.lower()
        if word not in self.lexicon:
            self.lexicon[word] = {}
        for relation in related:
            relation_type = relation["type"]
            group = {
                "words": [w.lower().strip() for w in relation["words"]],
                "definition": relation.get("definition")
            }
            if relation_type not in self.lexicon[word]:
                self.lexicon[word][relation_type] = []
            self.lexicon[word][relation_type].append(group)
            # Update inverted index
            for w in group["words"]:
                if w not in self.inverted_index:
                    self.inverted_index[w] = set()
                self.inverted_index[w].add(word)

    def delete_entry(self, word: str):
        word = word.lower()
        if word not in self.lexicon:
            raise KeyError(f"No custom synonyms found for word '{word}'.")
        # Remove from inverted index
        for relation_groups in self.lexicon[word].values():
            for group in relation_groups:
                for w in group["words"]:
                    if w in self.inverted_index:
                        self.inverted_index[w].discard(word)
                        if not self.inverted_index[w]:
                            del self.inverted_index[w]
        del self.lexicon[word]

    def get_related(self, word: str, relation_type: str) -> list[dict[str, Any]]:
        word = word.lower()
        if word in self.lexicon and relation_type in self.lexicon[word]:
            return self.lexicon[word][relation_type]
        return []

    def reverse_lookup(self, related_word: str) -> set[str]:
        related_word = related_word.lower()
        return self.inverted_index.get(related_word, set())
