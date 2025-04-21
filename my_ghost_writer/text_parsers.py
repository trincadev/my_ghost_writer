from typing import Iterator


def clean_string(s: str) -> str:
    """
    Clean a given string by removing punctuation using
    1. nltk.classify.TextCat()'s remove_punctuation() method
    2. removing new line characters
    and converting the string to lowercase.

    Args:
        s (str): The string to clean.

    Returns:
        str: The cleaned string.
    """
    from nltk.classify import TextCat
    tc = TextCat()
    cleaned_word = tc.remove_punctuation(text=s)
    return cleaned_word.translate(str.maketrans("", "", "\n\r"))


def get_words_tokens_and_indexes(
        words_tokens_list: list[str], offsets_tokens_list: list | Iterator, ps, min_len_words=3, sort_type=""
    ) -> dict:
    """
    Get the words tokens and their indexes in the text.

    Args:
        words_tokens_list (list): List of words tokens.
        offsets_tokens_list (list): List of offsets for each token.
        ps (PorterStemmer): The stemmer to use.
        min_len_words (int): Minimum length of words to include.
        sort_type (str): The type of sorting to apply. Can be "" (no sorting - default), "count" (by words count), "word" (alphabetical).

    Returns:
        dict: Dictionary with stemmed words as keys and a list of dictionaries
              containing the original word and its offsets as values.
    """
    words_stems_dict = {}
    for n_row, (words_tokens, offsets_tokens) in enumerate(zip(words_tokens_list, offsets_tokens_list)):
        for word, offsets in zip(words_tokens, offsets_tokens):
            cleaned_word = clean_string(word)
            if len(cleaned_word) < min_len_words:
                continue
            stem = ps.stem(word)
            if stem not in words_stems_dict:
                words_stems_dict[stem] = {"count": 0, "word_prefix": stem, "offsets_array": []}
            count, word_offsets = update_stems_list(words_stems_dict[stem], word, offsets, n_row=n_row)
            words_stems_dict[stem] = {"count": count, "word_prefix": stem, "offsets_array": word_offsets}
    return words_stems_dict


def update_stems_list(current_stem_tuple: dict, word: str, offsets: list, n_row: int) -> tuple:
    """
    Update the stems list with the new stem and its count.

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
    word_offsets.append({"word": word, "offsets": list(offsets), "n_row": n_row})
    return n, word_offsets
