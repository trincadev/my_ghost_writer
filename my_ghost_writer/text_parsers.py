from typing import Iterator

from nltk import PorterStemmer

from my_ghost_writer.constants import app_logger, N_WORDS_GRAM
from my_ghost_writer.type_hints import RequestTextRowsParentList, ResponseTextRowsDict

import json
from nltk.tokenize import sent_tokenize, wordpunct_tokenize, WordPunctTokenizer


ps = PorterStemmer()


def get_sentence_by_word(text: str, word: str, start_position: int, end_position: int) -> tuple[str, int, int]:
    sentences = sent_tokenize(text)
    offset = 0
    for sent in sentences:
        start = text.find(sent, offset)
        end = start + len(sent)
        if start <= start_position < end:
            check_word = text[start_position:end_position]
            assert check_word == word, f"word '{word}' doesn't match with start '{start_position}' and end '{end_position}' positions!"
            start_in_sentence = start_position - start
            end_in_sentence = start_in_sentence + end_position - start_position
            return sent, start_in_sentence, end_in_sentence
        offset = end
    raise ValueError(f"Can't find the given '{word}' word, with position '{start_position}', within the given text!")


def text_stemming(text: str | RequestTextRowsParentList, n = 3) -> ResponseTextRowsDict:
    """
    Applies Porter Stemmer algorithm to reduce words in a given text to their base form;
    then it uses WordPunctTokenizer() to produce a dict of words frequency with, for
    every recognized base form, a list of these repeated words with their position.

    Args:
        text (str): Input string containing the text to be stemmed.
        n (int): The maximum number of words to consider for n-grams (default is 3).

    Returns:
        tuple[int, dict]: a tuple with the number of processed total rows within the initial text and the word frequency dict
    """

    try:
        valid_textrows_with_num = json.loads(text)
        app_logger.info("valid_textrows_with_num::json")
    except (TypeError, json.decoder.JSONDecodeError):
        if isinstance(text, list):
            valid_textrows_with_num = text
            app_logger.info("valid_textrows_with_num::list:")
        elif isinstance(text, str):
            valid_textrows_with_num = [{"idxRow": i, "text": row} for i, row in enumerate(text.split("\n"))]
            app_logger.info("valid_textrows_with_num::str:")
        else:
            raise TypeError(f"Invalid input type. Expected plain text str, json str or list of dictionaries, not '{type(text)}'.")
    app_logger.debug(valid_textrows_with_num)
    app_logger.debug("=============================")
    row_words_tokens = []
    row_offsets_tokens = []
    idx_rows = []
    idx_rows_child = []
    idx_rows_parent = []
    rows_dict = {}
    for textrow in valid_textrows_with_num:
        row = textrow["text"]
        idx_row = textrow["idxRow"]
        rows_dict[idx_row] = row
        idx_rows.append(idx_row)
        try:
            idx_rows_child.append(textrow["idxRowChild"])
            idx_rows_parent.append(textrow["idxRowParent"])
        except KeyError:
            idx_rows_child.append(None)
            idx_rows_parent.append(None)
        row_words_tokens.append(wordpunct_tokenize(row))
        row_offsets_tokens.append(WordPunctTokenizer().span_tokenize(row))
    words_stems_dict = get_words_tokens_and_indexes_ngrams(row_words_tokens, row_offsets_tokens, idx_rows, idx_rows_child, idx_rows_parent, rows_dict=rows_dict, n=n)
    n_total_rows = len(valid_textrows_with_num)
    return n_total_rows, words_stems_dict


def update_stems_list(current_stem_tuple: dict, word: str, offsets: list, n_row: int, n_row_child: int, n_row_parent: int) -> tuple:
    """
    Update the stem list with the new stem and its count.

    Args:
        current_stem_tuple (tuple): Tuple containing the current stem count and list of words.
        offsets (list): List of offsets for the word.
        word (str): The word to stem.
        n_row (int): The row number in the original text.
        n_row_child (int): The child row number in the original text.
        n_row_parent (int): The parent row number in the original text.

    Returns:
        dict[str|list|int]: A dictionary with the stem string, its offsets and count.
    """
    n, word_offsets = current_stem_tuple["count"], current_stem_tuple["offsets_array"]
    n += 1
    word_offsets.append({"word": word, "offsets": list(offsets), "n_row": n_row, "n_row_child": n_row_child, "n_row_parent": n_row_parent})
    return n, word_offsets


def get_words_tokens_and_indexes_ngrams(
        words_tokens_list: list[list[str]] | Iterator,
        offsets_tokens_list: list[list[tuple[int, int]]] | Iterator,
        idx_rows_list: list[int],
        idx_rows_child: list[int],
        idx_rows_parent: list[int],
        rows_dict: dict[int, str],
        n: int = N_WORDS_GRAM
) -> dict:
    f"""
    Like get_words_tokens_and_indexes, but supports joined n-grams (from 1 up to n words).
    Returns a dict with n-gram stem as key and offsets/count as in example_result.
    The 'word_prefix' is set to the most common 'word' in offsets_array.

    Args:
        words_tokens_list (list): List of lists of words tokens.
        offsets_tokens_list (list): List of lists of offsets for each token.
        idx_rows_list (list[int]): List of row indices corresponding to the tokens.
        idx_rows_child (list[int]): List of child row indices corresponding to the tokens.
        idx_rows_parent (list[int]): List of parent row indices corresponding to the tokens.
        rows_dict (dict[int, str]): Dictionary mapping row indices to their text.
        n (int): The maximum number of words to consider for n-grams (default is from the N_WORDS_GRAM constant,
                 right now it has value of ${N_WORDS_GRAM}).

    Returns:
        dict: Dictionary with n-gram stems as keys and a dictionary of their counts, word prefixes, and offsets as values.
    """
    from collections import Counter

    ngram_dict = {}
    for (n_row, n_row_child, n_row_parent, words_tokens, offsets_tokens) in zip(
            idx_rows_list, idx_rows_child, idx_rows_parent, words_tokens_list, offsets_tokens_list
    ):
        words_tokens = list(words_tokens)
        offsets_tokens = list(offsets_tokens)
        length = len(words_tokens)
        for n_words_ngram in range(1, n + 1):
            for i in range(length - n_words_ngram + 1):
                row = rows_dict[n_row]
                ngram_words = words_tokens[i:i + n_words_ngram]
                stem_list = [ps.stem(word=word) for word in ngram_words]
                ngram_offsets = offsets_tokens[i:i + n_words_ngram]
                start = ngram_offsets[0][0]
                end = ngram_offsets[-1][1]
                ngram_stem = " ".join(stem_list)
                ngram = row[start:end]
                if ngram_stem not in ngram_dict:
                    ngram_dict[ngram_stem] = {"count": 0, "word_prefix": ngram, "offsets_array": [], "n_words_ngram": n_words_ngram}
                # Use update_stems_list to update count and offsets_array
                count, offsets_array = update_stems_list(
                    ngram_dict[ngram_stem],
                    ngram,
                    [start, end],
                    n_row=n_row,
                    n_row_child=n_row_child,
                    n_row_parent=n_row_parent
                )
                ngram_dict[ngram_stem]["count"] = count
                ngram_dict[ngram_stem]["offsets_array"] = offsets_array

    # Update word_prefix to the most common 'word' in offsets_array
    for entry in ngram_dict.values():
        words = [item["word"] for item in entry["offsets_array"] if "word" in item]
        if words:
            most_common_word, _ = Counter(words).most_common(1)[0]
            entry["word_prefix"] = most_common_word

    return ngram_dict
