import spacy
import nltk
from nltk.corpus import wordnet
import pyinflect
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.error(
        "spaCy model 'en_core_web_sm' not found. Please install it with: python -m spacy download en_core_web_sm")
    nlp = None

# Ensure NLTK data is downloaded
try:
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
except Exception as e:
    logger.error(f"Failed to download NLTK data: {e}")


def is_nlp_available() -> bool:
    """Check if spaCy model is available"""
    return nlp is not None


def extract_contextual_info_by_indices(text: str, start_idx: int, end_idx: int, target_word: str) -> Dict[str, Any]:
    """Extract grammatical and contextual information using character indices"""
    if nlp is None:
        raise HTTPException(status_code=500, detail="spaCy model not available")

    # Verify the indices match the expected word
    if start_idx < 0 or end_idx > len(text) or start_idx >= end_idx:
        raise HTTPException(status_code=400, detail="Invalid start/end indices")

    extracted_word = text[start_idx:end_idx].strip()
    if extracted_word.lower() != target_word.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Word mismatch: expected '{target_word}', got '{extracted_word}'"
        )

    try:
        # Process the entire text with spaCy
        doc = nlp(text)

        # Find the token that corresponds to our character indices
        target_token = None
        for token in doc:
            # Check if this token overlaps with our target indices
            if (token.idx <= start_idx < token.idx + len(token.text) or
                    start_idx <= token.idx < end_idx):
                target_token = token
                break

        if target_token is None:
            # Fallback: try to find by exact text match
            for token in doc:
                if (token.text.lower() == target_word.lower() and
                        abs(token.idx - start_idx) < 5):  # Allow small index discrepancy
                    target_token = token
                    break

        if target_token is None:
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

        # Get context window
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

    except Exception as e:
        logger.error(f"Error in contextual analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing context: {str(e)}")


def get_wordnet_synonyms(word: str, pos_tag: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get synonyms from WordNet with optional POS filtering"""
    try:
        synonyms_by_sense = []

        # Map spaCy POS to WordNet POS
        pos_map = {
            'NOUN': wordnet.NOUN,
            'VERB': wordnet.VERB,
            'ADJ': wordnet.ADJ,
            'ADV': wordnet.ADV
        }

        # Get all synsets for the word
        synsets = wordnet.synsets(word)

        # Filter by POS if provided
        if pos_tag and pos_tag in pos_map:
            synsets = [s for s in synsets if s.pos() == pos_map[pos_tag]]

        for synset in synsets:
            sense_data = {
                'definition': synset.definition(),
                'examples': synset.examples()[:2],  # Limit examples
                'synonyms': [],
                'pos': synset.pos()
            }

            for lemma in synset.lemmas():
                synonym = lemma.name().replace('_', ' ')
                if synonym.lower() != word.lower():
                    sense_data['synonyms'].append(synonym)

            if sense_data['synonyms']:  # Only add if we have synonyms
                synonyms_by_sense.append(sense_data)

        return synonyms_by_sense

    except Exception as e:
        logger.error(f"Error getting WordNet synonyms: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving synonyms: {str(e)}")


def inflect_synonym(synonym: str, original_token_info: Dict[str, Any]) -> str:
    """Adapt synonym to match original word's grammatical form"""
    if nlp is None:
        return synonym

    pos = original_token_info['pos']
    tag = original_token_info['tag']

    # Handle capitalization first
    if original_token_info['is_title']:
        synonym = synonym.capitalize()
    elif original_token_info['is_upper']:
        synonym = synonym.upper()
    elif original_token_info['is_lower']:
        synonym = synonym.lower()

    # Handle grammatical inflection
    try:
        if pos == 'NOUN':
            if tag in ['NNS', 'NNPS']:  # Plural nouns
                doc = nlp(synonym)
                if doc and len(doc) > 0:
                    inflected = doc[0]._.inflect('plural')
                    return inflected if inflected else synonym

        elif pos == 'VERB':
            if tag in ['VBD', 'VBN']:  # Past tense/participle
                doc = nlp(synonym)
                if doc and len(doc) > 0:
                    inflected = doc[0]._.inflect(tag)
                    return inflected if inflected else synonym
            elif tag == 'VBZ':  # Third person singular
                doc = nlp(synonym)
                if doc and len(doc) > 0:
                    inflected = doc[0]._.inflect('VBZ')
                    return inflected if inflected else synonym
            elif tag == 'VBG':  # Present participle
                doc = nlp(synonym)
                if doc and len(doc) > 0:
                    inflected = doc[0]._.inflect('VBG')
                    return inflected if inflected else synonym

        elif pos == 'ADJ':
            if tag in ['JJR', 'JJS']:  # Comparative/superlative
                doc = nlp(synonym)
                if doc and len(doc) > 0:
                    if tag == 'JJR':
                        inflected = doc[0]._.inflect('comparative')
                    else:
                        inflected = doc[0]._.inflect('superlative')
                    return inflected if inflected else synonym

    except Exception as e:
        logger.warning(f"Inflection error for '{synonym}': {e}")
        # Return original synonym if inflection fails
        pass

    return synonym


def process_synonym_groups(word: str, context_info: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Process synonym groups with inflection matching"""
    # Get synonyms from WordNet
    synonyms_by_sense = get_wordnet_synonyms(word, context_info['pos'])

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
            # Get both base form and inflected form
            base_form = synonym
            inflected_form = inflect_synonym(synonym, context_info)

            processed_sense["synonyms"].append({
                "base_form": base_form,
                "inflected_form": inflected_form,
                "matches_context": inflected_form != base_form
            })

        processed_synonyms.append(processed_sense)

    return processed_synonyms