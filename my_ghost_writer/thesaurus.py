from typing import Any

from nltk.corpus import wordnet31 as wn

from my_ghost_writer.type_hints import ResponseWordsAPI


def get_current_info_wordnet():
    return {"languages": wn.langs(), "version": wn.get_version()}


def get_synsets_by_word_and_language(word: str, lang: str = "eng") -> ResponseWordsAPI:
    results = []
    for synset in wn.synsets(word, lang=lang):
        # Synonyms (lemmas for this synset, excluding the input word)
        synonyms = sorted(
            set(
                l.name().replace('_', ' ')
                for l in synset.lemmas(lang=lang)
                if l.name().lower() != word.lower()
            )
        )
        # Antonyms (from lemmas)
        antonyms = sorted(
            set(
                ant.name().replace('_', ' ')
                for l in synset.lemmas(lang=lang)
                for ant in l.antonyms()
            )
        )
        # Derivationally related forms (from lemmas)
        derivation = sorted(
            set(
                d.name().replace('_', ' ')
                for l in synset.lemmas(lang=lang)
                for d in l.derivationally_related_forms()
            )
        )
        # Pertainyms (from lemmas)
        pertains_to = sorted(
            set(
                p.name().replace('_', ' ')
                for l in synset.lemmas(lang=lang)
                for p in l.pertainyms()
            )
        )
        # Synset relations
        type_of = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.hypernyms()
                for l in h.lemmas(lang=lang)
            )
        )
        # Hyponyms (hasTypes)
        has_types = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.hyponyms()
                for l in h.lemmas(lang=lang)
            )
        )
        # Holonyms (partOf)
        part_of = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.member_holonyms() + synset.part_holonyms() + synset.substance_holonyms()
                for l in h.lemmas(lang=lang)
            )
        )
        # Meronyms (hasParts)
        has_parts = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.member_meronyms() + synset.part_meronyms() + synset.substance_meronyms()
                for l in h.lemmas(lang=lang)
            )
        )
        instance_of = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.instance_hypernyms()
                for l in h.lemmas(lang=lang)
            )
        )
        has_instances = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.instance_hyponyms()
                for l in h.lemmas(lang=lang)
            )
        )
        similar_to = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.similar_tos()
                for l in h.lemmas(lang=lang)
            )
        )
        also = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.also_sees()
                for l in h.lemmas(lang=lang)
            )
        )
        entails = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.entailments()
                for l in h.lemmas(lang=lang)
            )
        )
        causes = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.causes()
                for l in h.lemmas(lang=lang)
            )
        )
        verb_groups = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.verb_groups()
                for l in h.lemmas(lang=lang)
            )
        )
        has_substances = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.substance_meronyms()
                for l in h.lemmas(lang=lang)
            )
        )
        in_category = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.topic_domains()
                for l in h.lemmas(lang=lang)
            )
        )
        usage_of = sorted(
            set(
                l.name().replace('_', ' ')
                for h in synset.usage_domains()
                for l in h.lemmas(lang=lang)
            )
        )
        obj = {
            "definition": synset.definition(lang=lang),
        }
        if synonyms:
            obj["synonyms"] = synonyms
        if type_of:
            obj["typeOf"] = type_of
        if has_types:
            obj["hasTypes"] = has_types
        if part_of:
            obj["partOf"] = part_of
        if has_parts:
            obj["hasParts"] = has_parts
        if antonyms:
            obj["antonyms"] = antonyms
        if derivation:
            obj["derivation"] = derivation
        if pertains_to:
            obj["pertainsTo"] = pertains_to
        if instance_of:
            obj["instanceOf"] = instance_of
        if has_instances:
            obj["hasInstances"] = has_instances
        if similar_to:
            obj["similarTo"] = similar_to
        if also:
            obj["also"] = also
        if entails:
            obj["entails"] = entails
        if has_substances:
            obj["hasSubstances"] = has_substances
        if in_category:
            obj["inCategory"] = in_category
        if usage_of:
            obj["usageOf"] = usage_of
        if causes:
            obj["causes"] = causes
        if verb_groups:
            obj["verbGroups"] = verb_groups
        results.append(obj)
    return {
        "word": word,
        "results": results
    }
