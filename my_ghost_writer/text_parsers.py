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


def text_stemming(text) -> tuple[int, dict]:
    """
    Applies Porter Stemmer algorithm to reduce words in a given text to their base form,
    then it uses WordPunctTokenizer() to produce a dict of words frequency with, for
    every recognized base form, a list of these repeated words with their position.

    Args:
        text (str): Input string containing the text to be stemmed.

    Returns:
        tuple[int, dict]: a tuple with the number of processed total rows within the initial text and the words frequency dict
    """
    from nltk import PorterStemmer
    from nltk.tokenize import wordpunct_tokenize, WordPunctTokenizer
    from my_ghost_writer.text_parsers import get_words_tokens_and_indexes
    
    ps = PorterStemmer()
    text_split_newline = text.split("\n")
    row_words_tokens = []
    row_offsets_tokens = []
    for row in text_split_newline:
        row_words_tokens.append(wordpunct_tokenize(row))
        row_offsets_tokens.append(WordPunctTokenizer().span_tokenize(row))
    words_stems_dict = get_words_tokens_and_indexes(row_words_tokens, row_offsets_tokens, ps)
    n_total_rows = len(text_split_newline)
    return n_total_rows, words_stems_dict


def get_words_tokens_and_indexes(
        words_tokens_list: list[str], offsets_tokens_list: list | Iterator, ps, min_len_words=3
    ) -> dict:
    """
    Get the words tokens and their indexes in the text.

    Args:
        words_tokens_list (list): List of words tokens.
        offsets_tokens_list (list): List of offsets for each token.
        ps (PorterStemmer): The stemmer to use.
        min_len_words (int): Minimum length of words to include.

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
