from nltk.corpus import wordnet31 as wn

from my_ghost_writer.constants import app_logger
from my_ghost_writer.type_hints import ResponseWordsAPI


def get_current_info_wordnet(preload_wordnet=False):
    if preload_wordnet:
        wn.synsets("test")  # prelaod wordnet
    return {"languages": wn.langs(), "version": wn.get_version(), "preload_wordnet": preload_wordnet}


def get_synsets_by_word_and_language(word: str, lang: str = "eng") -> ResponseWordsAPI:
    app_logger.info("start...")
    def lemma_names(synsets):
        return sorted(
            set(
                lemma.name().replace('_', ' ')
                for syn in synsets
                for lemma in syn.lemmas(lang=lang)
            )
        )

    def lemma_related(lemmas_input, lemmas_method):
        return sorted(
            set(
                rel.name().replace('_', ' ')
                for lemma in lemmas_input
                for rel in getattr(lemma, lemmas_method)()
            )
        )

    results = []
    for synset in wn.synsets(word, lang=lang):
        lemmas = synset.lemmas(lang=lang)
        obj = {"definition": synset.definition(lang=lang)}

        # Single-line fields
        synonyms = sorted(
            set(
                lemma.name().replace('_', ' ')
                for lemma in lemmas
                if lemma.name().lower() != word.lower()
            )
        )
        if synonyms:
            obj["synonyms"] = synonyms

        # Lemma-based relations
        for field, method in [
            ("antonyms", "antonyms"),
            ("derivation", "derivationally_related_forms"),
            ("pertainsTo", "pertainyms"),
        ]:
            values = lemma_related(lemmas, method)
            if values:
                obj[field] = values

        # Synset-based relations
        synset_relations = [
            ("typeOf", synset.hypernyms()),
            ("hasTypes", synset.hyponyms()),
            ("partOf", synset.member_holonyms() + synset.part_holonyms() + synset.substance_holonyms()),
            ("hasParts", synset.member_meronyms() + synset.part_meronyms() + synset.substance_meronyms()),
            ("instanceOf", synset.instance_hypernyms()),
            ("hasInstances", synset.instance_hyponyms()),
            ("similarTo", synset.similar_tos()),
            ("also", synset.also_sees()),
            ("entails", synset.entailments()),
            ("hasSubstances", synset.substance_meronyms()),
            ("inCategory", synset.topic_domains()),
            ("usageOf", synset.usage_domains()),
            ("causes", synset.causes()),
            ("verbGroups", synset.verb_groups()),
        ]
        for field, syns in synset_relations:
            values = lemma_names(syns)
            if values:
                obj[field] = values

        results.append(obj)
    return {
        "word": word,
        "results": results
    }
