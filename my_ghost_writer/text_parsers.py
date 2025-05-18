from typing import Iterator

from my_ghost_writer.constants import app_logger
from my_ghost_writer.type_hints import RequestTextRowsParentList, ResponseTextRowsDict


def text_stemming(text: str | RequestTextRowsParentList) -> ResponseTextRowsDict:
    """
    Applies Porter Stemmer algorithm to reduce words in a given text to their base form;
    then it uses WordPunctTokenizer() to produce a dict of words frequency with, for
    every recognized base form, a list of these repeated words with their position.

    Args:
        text (str): Input string containing the text to be stemmed.

    Returns:
        tuple[int, dict]: a tuple with the number of processed total rows within the initial text and the words frequency dict
    """
    import json
    from nltk import PorterStemmer
    from nltk.tokenize import wordpunct_tokenize, WordPunctTokenizer
    from my_ghost_writer.text_parsers import get_words_tokens_and_indexes
    
    ps = PorterStemmer()
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
            raise TypeError(f"Invalid input type. Expected json str or list of dictionaries, not '{type(text)}'.")
    app_logger.debug(valid_textrows_with_num)
    app_logger.debug("=============================")
    row_words_tokens = []
    row_offsets_tokens = []
    idx_rows = []
    idx_rows_child = []
    idx_rows_parent = []
    for textrow in valid_textrows_with_num:
        row = textrow["text"]
        idx_rows.append(textrow["idxRow"])
        idx_rows_child.append(textrow["idxRowChild"])
        idx_rows_parent.append(textrow["idxRowParent"])
        row_words_tokens.append(wordpunct_tokenize(row))
        row_offsets_tokens.append(WordPunctTokenizer().span_tokenize(row))
    words_stems_dict = get_words_tokens_and_indexes(row_words_tokens, row_offsets_tokens, ps, idx_rows, idx_rows_child, idx_rows_parent)
    n_total_rows = len(valid_textrows_with_num)
    return n_total_rows, words_stems_dict


def get_words_tokens_and_indexes(
        words_tokens_list: list[str], offsets_tokens_list: list | Iterator, ps, idx_rows_list: list[int], idx_rows_child: list[int], idx_rows_parent: list[int]
    ) -> dict:
    """
    Get the word tokens and their indexes in the text.

    Args:
        words_tokens_list (list): List of words tokens.
        offsets_tokens_list (list): List of offsets for each token.
        ps (PorterStemmer): The stemmer to use.
        idx_rows_list (list[int]): List of row indices corresponding to the tokens.

    Returns:
        dict: Dictionary with stemmed words as keys and a list of dictionaries
              containing the original word and its offsets as values.
    """
    words_stems_dict = {}
    for (n_row, n_row_child, n_row_parent, words_tokens, offsets_tokens) in zip(idx_rows_list, idx_rows_child, idx_rows_parent, words_tokens_list, offsets_tokens_list):
        for word, offsets in zip(words_tokens, offsets_tokens):
            stem = ps.stem(word)
            if stem not in words_stems_dict:
                words_stems_dict[stem] = {"count": 0, "word_prefix": stem, "offsets_array": []}
            count, word_offsets = update_stems_list(words_stems_dict[stem], word, offsets, n_row=n_row, n_row_child=n_row_child, n_row_parent=n_row_parent)
            words_stems_dict[stem] = {"count": count, "word_prefix": stem, "offsets_array": word_offsets}
    return words_stems_dict


def update_stems_list(current_stem_tuple: dict, word: str, offsets: list, n_row: int, n_row_child: int, n_row_parent: int) -> tuple:
    """
    Update the stem list with the new stem and its count.

    Args:
        current_stem_tuple (tuple): Tuple containing the current stem count and list of words.
        offsets (list): List of offsets for the word.
        word (str): The word to stem.
        n_row (int): The row number in the original text.

    Returns:
        dict[str|list|int]: A dictionary with the stem string, its offsets and count.
    """
    n, word_offsets = current_stem_tuple["count"], current_stem_tuple["offsets_array"]
    n += 1
    word_offsets.append({"word": word, "offsets": list(offsets), "n_row": n_row, "n_row_child": n_row_child, "n_row_parent": n_row_parent})
    return n, word_offsets
