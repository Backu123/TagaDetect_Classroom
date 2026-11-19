"""taga_features.py - text normalization and style features shared by training and the app."""
import math
import re
from collections import Counter

import numpy as np

NORMALIZATION_VERSION = "lowercase + digits removed + punctuation removed (v1)"

_DIGITS = re.compile(r"\d+")
_PUNCT = re.compile(r"[^\w\s]")
_SPACES = re.compile(r"\s+")


def normalize_text(text):
    """Lowercase, replace digits and punctuation with spaces, collapse whitespace.

    This is the exact function behind the Text_Normalized column. Training and the web
    app must both call it so that the models always see the same kind of text.
    """
    text = str(text).lower()
    text = _DIGITS.sub(" ", text)
    text = _PUNCT.sub(" ", text)
    return _SPACES.sub(" ", text).strip()


TL_FUNCTION_WORDS = frozenset(
    "ang ng sa mga ay na at ni kay para hindi lang naman kasi pero yung nito niya namin natin nila "
    "mo ko ka si wala ngayon dahil upang kung ayon noong habang pa daw raw rin din ito iyon ako ikaw "
    "siya kami tayo sila mayroon po ba".split()
)
EN_FUNCTION_WORDS = frozenset(
    "the of and to in is that it for was on with as by this are be have has from or an but not they "
    "we you he she his her their which would can will been were had do does".split()
)

STYLE_FEATURE_NAMES = [
    "mean_word_len", "std_word_len", "share_long_words", "share_short_words",
    "mattr_15", "repeat_bigram_ratio", "repeat_trigram_ratio", "top3_word_share",
    "hapax_share_first20", "char_entropy", "vowel_ratio", "english_function_share",
    "tagalog_function_share",
]


def style_features(clean_text, max_words=80):
    """Length-robust style measurements computed on NORMALIZED text.

    Sentence length and punctuation features are deliberately left out: the human Taglish
    rows have no punctuation or capital letters, so those features would give the label away.
    """
    words = clean_text.split()[:max_words]
    n = len(words)
    if n == 0:
        return [0.0] * len(STYLE_FEATURE_NAMES)

    lens = np.array([len(w) for w in words], dtype=float)

    window = 15
    if n >= window:
        mattr = float(np.mean([len(set(words[i:i + window])) / window for i in range(n - window + 1)]))
    else:
        mattr = len(set(words)) / n

    bigrams = list(zip(words, words[1:]))
    trigrams = list(zip(words, words[1:], words[2:]))
    repeat_bi = 1.0 - len(set(bigrams)) / len(bigrams) if bigrams else 0.0
    repeat_tri = 1.0 - len(set(trigrams)) / len(trigrams) if trigrams else 0.0

    counts = Counter(words)
    top3 = sum(c for _, c in counts.most_common(3)) / n

    first = words[:20]
    first_counts = Counter(first)
    hapax = sum(1 for c in first_counts.values() if c == 1) / len(first)

    chars = Counter("".join(words))
    total = sum(chars.values())
    entropy = -sum((c / total) * math.log2(c / total) for c in chars.values())
    vowels = sum(chars.get(v, 0) for v in "aeiou") / total

    english = sum(1 for w in words if w in EN_FUNCTION_WORDS) / n
    tagalog = sum(1 for w in words if w in TL_FUNCTION_WORDS) / n

    return [
        float(lens.mean()), float(lens.std()), float((lens >= 8).mean()), float((lens <= 3).mean()),
        mattr, repeat_bi, repeat_tri, top3, hapax, entropy, vowels, english, tagalog,
    ]
