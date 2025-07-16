from datetime import datetime

import spacy
import nltk
# pynflect needed to avoid different inflection
import pyinflect
from typing import Any, Optional
from fastapi import HTTPException

from my_ghost_writer.constants import SPACY_MODEL_NAME, app_logger, ELIGIBLE_POS
from my_ghost_writer.custom_synonym_handler import CustomSynonymHandler
from my_ghost_writer.thesaurus import wn
from my_ghost_writer.type_hints import WordSynonymResult, ContextInfo, SynonymGroup


custom_synonyms: dict[str, list[str]] = {}
custom_synonym_handler = CustomSynonymHandler()
# Load spaCy model
nlp = None
try:
    nlp = spacy.load(SPACY_MODEL_NAME)
    app_logger.info(f"spacy model {SPACY_MODEL_NAME} has type:'{type(nlp)}'")
except (OSError, IOError) as io_ex:
    app_logger.error(io_ex)
    app_logger.error(
        f"spaCy model '{SPACY_MODEL_NAME}' not found. Please install it with: 'python -m spacy download {SPACY_MODEL_NAME}'"
    )

# Ensure NLTK data is downloaded
try:
    nltk.download('wordnet', quiet=False)
    nltk.download('english_wordnet', quiet=False)
except Exception as e:
    app_logger.error(f"Failed to download NLTK data: {e}")


def is_nlp_available() -> bool:
    """Check if spaCy model is available"""
    return nlp is not None


def find_synonyms_for_phrase(text: str, start_idx: int, end_idx: int) -> list[WordSynonymResult]:
    """
    Finds synonyms for all eligible words within a selected text span.
    It analyzes the span, filters for meaningful words (nouns, verbs, etc.),
    and returns a list of synonym results for each.
    """
    if nlp is None:
        app_logger.error(
            f"spaCy model '{SPACY_MODEL_NAME}' not found. Please install it with: 'python -m spacy download {SPACY_MODEL_NAME}'"
        )
        raise HTTPException(status_code=503, detail="NLP service is unavailable")

    doc = nlp(text)
    # Use 'expand' to ensure the span covers full tokens even with partial selection
    span = doc.char_span(start_idx, end_idx, alignment_mode="expand")

    if span is None:
        app_logger.warning(f"Could not create a valid token span from indices {start_idx}-{end_idx}.")
        # Return an empty list if no valid span can be formed, the client can handle this
        return []

    # Define which POS tags are eligible for synonym lookup
    results: list[WordSynonymResult] = []

    for token in span:
        # Process only if the token is an eligible part of speech and not a stop word or punctuation
        if token.pos_ in ELIGIBLE_POS and not token.is_stop and not token.is_punct:
            try:
                # 1. Get context for this specific token
                context_info_dict = extract_contextual_info_by_indices(
                    text, token.idx, token.idx + len(token.text), token.text
                )

                # 2. Get synonym groups using the token's lemma for a better search
                synonym_groups_list = process_synonym_groups(context_info_dict['lemma'], context_info_dict)

                # 3. If we find synonyms, build the result object for this word
                if synonym_groups_list:
                    # Restructure dicts into Pydantic models for type safety
                    context_info_model = ContextInfo(
                        pos=context_info_dict['pos'],
                        sentence=context_info_dict['context_sentence'],
                        grammatical_form=context_info_dict['tag'],
                        context_words=context_info_dict['context_words'],
                        dependency=context_info_dict['dependency']
                    )
                    local_start_idx = token.idx - start_idx
                    local_end_idx = local_start_idx + len(token.text)
                    sliced_sentence = text[start_idx:end_idx]
                    sliced_word = sliced_sentence[local_start_idx:local_end_idx]
                    assert sliced_word == token.text, (f"Mismatch! sliced_word ({sliced_word}) != token.text ({token.text}), but these substrings should be equal.\n"
                                                       f" start_idx:{start_idx}, End_word:{end_idx}. local_start_idx:{local_start_idx}, local_end_idx:{local_end_idx}.")
                    word_result = WordSynonymResult(
                        original_word=token.text,
                        original_indices={"start": local_start_idx, "end": local_end_idx},
                        context_info=context_info_model,
                        synonym_groups=[SynonymGroup(**sg) for sg in synonym_groups_list],
                        debug_info={
                            "spacy_token_indices": {
                                "start": context_info_dict['char_start'],
                                "end": context_info_dict['char_end']
                            },
                            "lemma": context_info_dict['lemma']
                        }
                    )
                    results.append(word_result)

            except HTTPException as http_ex:
                app_logger.warning(f"Could not process token '{token.text}': '{http_ex.detail}'")
            except Exception as synonym_ex:
                app_logger.error(f"Unexpected error processing token '{token.text}': '{synonym_ex}'", exc_info=True)

    return results


def extract_contextual_info_by_indices(text: str, start_idx: int, end_idx: int, target_word: str) -> dict[str, Any]:
    """Extract grammatical and contextual information using character indices"""
    if nlp is None:
        raise HTTPException(status_code=500, detail="spaCy model not available")

    # Verify the indices match the expected word
    if start_idx < 0 or end_idx > len(text) or start_idx >= end_idx:
        raise HTTPException(status_code=400, detail="Invalid start/end indices")

    try:
        doc = nlp(text)

        # Find the token that corresponds to our character indices
        target_token = None
        for token in doc:
            # Check if this token overlaps with our target indices
            if (token.idx <= start_idx < token.idx + len(token.text) or
                    start_idx <= token.idx < end_idx):
                target_token = token
                break

        # If the primary loop didn't find a token, it's an unexpected state,
        # but the original code to handle this was unreachable.
        # The most likely failure is now a word/index mismatch, handled above.
        if target_token is None or str(target_token) != target_word:
            raise HTTPException(
                status_code=400,
                detail=f"Could not find token for word '{target_word}' at indices {start_idx}-{end_idx}"
            )

        # Extract surrounding context (±5 words)
        sentence_tokens = [t for t in target_token.sent if not t.is_space]
        target_position_in_sentence = None
        for i, token in enumerate(sentence_tokens):
            if token == target_token:
                target_position_in_sentence = i
                break

        # Get the context window
        context_start = max(0, target_position_in_sentence - 5) if target_position_in_sentence else 0
        context_end = min(len(sentence_tokens),
                          target_position_in_sentence + 6) if target_position_in_sentence else len(sentence_tokens)
        context_words = [t.text for t in sentence_tokens[context_start:context_end]]

        return {
            'word': target_token.text,
            'lemma': target_token.lemma_,
            'pos': target_token.pos_,
            'tag': target_token.tag_,
            'is_title': target_token.is_title,
            'is_upper': target_token.is_upper,
            'is_lower': target_token.is_lower,
            'dependency': target_token.dep_,
            'context_sentence': target_token.sent.text,
            'context_words': context_words,
            'sentence_position': target_position_in_sentence,
            'char_start': target_token.idx,
            'char_end': target_token.idx + len(target_token.text),
            'original_indices': {'start': start_idx, 'end': end_idx}
        }

    except Exception as indices_ex:
        app_logger.error(f"Error in contextual analysis: {indices_ex}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing context: {str(indices_ex)}")


def get_wordnet_synonyms(word: str, pos_tag: Optional[str] = None) -> list[dict[str, Any]]:
    """Get synonyms from wn with optional POS filtering.
    Includes custom synonyms with a flag.  Also performs a reverse lookup."""

    # 1. Check for custom synonyms in in-memory store
    app_logger.info("custom_synonyms:")
    app_logger.info(custom_synonyms)
    word_lower = word.lower()
    synonyms_by_sense: list[dict[str, Any]] = []  # Initialize the list here

    # 1. Custom Synonym Lookup and Preparation
    custom_synset = None  # Initialize to None
    # 1. Direct Lookup: Check if the word is directly in custom_synonyms
    related_synonyms = custom_synonym_handler.get_related(word_lower, "synonym")
    if related_synonyms:
        app_logger.info(f"found custom_synonyms:{related_synonyms} by word:{word_lower}!")
        synonyms_list: list[dict[str, Any]] = []
        for related in related_synonyms:
            synonyms_list.append({"synonym": related["word"], "is_custom": True, "definition": related.get("definition")})
        if synonyms_list:
            custom_synset = {
                'definition': 'User-defined synonym.',
                'examples': [],
                'synonyms': synonyms_list
            }
            if pos_tag:
                custom_synset["pos"] = pos_tag

    # 2. Reverse Lookup: Check if the word is a *synonym* of any custom word
    reverse_lookup_words = custom_synonym_handler.reverse_lookup(word_lower)

    if reverse_lookup_words:
        app_logger.info(f"found reverse match: '{word_lower}' is a synonym of '{reverse_lookup_words}'")
        # Found a reverse match!
        # The reverse_lookup return the original word, not a list of synonyms
        synonyms_list: list[dict[str, Any]] = [{"synonym": reverse_word, "is_custom": True} for reverse_word in reverse_lookup_words]

        custom_synset = {
            'definition': f'User-defined synonym (reverse match for "{word}").',
            'examples': [],
            'synonyms': synonyms_list
        }
        if pos_tag:
            custom_synset["pos"] = pos_tag

    # 3. WordNet Lookup
    try:
        # Map spaCy POS to wn POS
        pos_map = {
            'NOUN': wn.NOUN,
            'VERB': wn.VERB,
            'ADJ': wn.ADJ,
            'ADV': wn.ADV
        }

        # Get all synsets for the word
        synsets = wn.synsets(word)

        # Filter by POS if provided
        if pos_tag and pos_tag in pos_map:
            synsets = [s for s in synsets if s.pos() == pos_map[pos_tag]]

        for synset in synsets:
            sense_data = {
                'definition': synset.definition(),
                'examples': synset.examples()[:2],  # Limit examples
                'synonyms': [],
            }
            # Add pos only if it's available
            syn_pos = synset.pos()
            if syn_pos:
              sense_data['pos'] = syn_pos

            # Use a set to avoid duplicate synonyms from different lemmas in the same synset
            unique_synonyms = set()
            for lemma in synset.lemmas():
                synonym = lemma.name().replace('_', ' ')
                if synonym.lower() != word.lower():
                    unique_synonyms.add(synonym)

            if unique_synonyms:
                # add synonyms (without is_custom) since these are WordNet synonyms
                sense_data['synonyms'] = sorted(list(unique_synonyms))
                synonyms_by_sense.append(sense_data)

    except Exception as ex1:
        app_logger.error(f"Error getting wn synonyms: {ex1}")
        raise HTTPException(status_code=500, detail=f"Error retrieving synonyms: {str(ex1)}")

    # 4. Combine Custom and WordNet Synsets
    if custom_synset:
        synonyms_by_sense.insert(0, custom_synset)  # Add custom synset at the beginning

    return synonyms_by_sense


def inflect_synonym(synonym: str, original_token_info: dict[str, Any]) -> str:
    """Adapt the input synonym arg to match the original word's grammatical form"""

    if nlp is None:
        return synonym

    pos = original_token_info.get('pos')
    tag = original_token_info.get('tag')

    # Handle capitalization first using .get() for safety
    if original_token_info.get('is_title'):
        synonym = synonym.title() # .title() is better for multi-word phrases
    elif original_token_info.get('is_upper'):
        synonym = synonym.upper()
    elif original_token_info.get('is_lower', True):  # Default to lower
        synonym = synonym.lower()

    # Handle grammatical inflection
    try:
        # Define all tags that require inflection in one place
        inflection_tags = {
            'NOUN': ['NNS', 'NNPS'],
            'VERB': ['VBD', 'VBN', 'VBZ', 'VBG'],
            'ADJ': ['JJR', 'JJS']
        }

        # Single check for all inflection cases
        if pos in inflection_tags and tag in inflection_tags.get(pos, []):
            doc = nlp(synonym)
            if doc and len(doc) > 0:
                inflected = doc[0]._.inflect(tag)
                if inflected:
                    # Re-join with the rest of the phrase if it was multi-word
                    return inflected + synonym[len(doc[0].text):]
                return synonym # Return original if inflection fails

    except Exception as ex2:
        app_logger.warning(f"Inflection error for '{synonym}': '{ex2}'")
        # Return the original synonym if inflection fails

    return synonym


def process_synonym_groups(word: str, context_info: dict[str, Any]) -> list[dict[str, Any]]:
    """Process synonym groups with inflection matching"""
    # Get synonyms from wn
    t0 = datetime.now()
    # Get synonyms from wn using the lemma
    synonyms_by_sense = get_wordnet_synonyms(context_info['lemma'], context_info['pos'])
    t1 = datetime.now()
    duration = (t1 - t0).total_seconds()
    app_logger.info(f"# 1/Got get_wordnet_synonyms result with '{word}' word in {duration:.3f}s.")

    if not synonyms_by_sense:
        return []

    # Process each synonym group
    processed_synonyms = []
    for sense in synonyms_by_sense:
        processed_sense = {
            "definition": sense['definition'],
            "examples": sense['examples'],
            "wordnet_pos": sense['pos'],
            "synonyms": []
        }

        for synonym in sense['synonyms']:
            # Get both the base form and inflected form
            app_logger.info("## synonym ##")
            app_logger.info(type(synonym))
            app_logger.info(synonym)
            synonym_str = synonym
            if isinstance(synonym, dict):
                synonym_str = synonym["synonym"]

            base_form = synonym_str
            app_logger.info("## synonym ##")
            app_logger.info(type(synonym_str))
            app_logger.info(synonym_str)
            inflected_form = inflect_synonym(synonym_str, context_info)

            processed_sense["synonyms"].append({
                "base_form": base_form,
                "inflected_form": inflected_form,
                "matches_context": inflected_form.lower() != base_form.lower()
            })

        processed_synonyms.append(processed_sense)

    return processed_synonyms