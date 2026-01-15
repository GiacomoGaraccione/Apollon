import logging
import os
from datetime import datetime
import Levenshtein


def find_closest_strings(dict1, dict2):
    """
    Receives two dictionaries with 'name' and 'synonyms' (list of strings).
    Computes the Levenshtein distance between both 'name' attributes and,
    for each 'name', the distance with the 'synonyms' of the other dictionary.
    Returns the two strings with the lowest distance and the computed value.
    """

    strings1 = [dict1["name"]] + dict1.get("synonyms", [])
    strings2 = [dict2["name"]] + dict2.get("synonyms", [])

    max_distance = None
    closest_pair = (None, None)

    for s1 in strings1:
        for s2 in strings2:
            dist = 1 - Levenshtein.distance(s1.lower(), s2.lower()) / max(len(s1), len(s2), 1)
            if (max_distance is None) or (dist > max_distance):
                max_distance = dist
                closest_pair = (s1, s2)
    return closest_pair[0], closest_pair[1], max_distance