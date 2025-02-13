import json
import requests


def best_translation(data):
    if not data or "matches" not in data:
        return None
    best_tran = data.get("responseData", {}).get("translatedText", None)
    candidates = []
    for match in data["matches"]:
        translation = match.get("translation", None)
        usage_count = match.get("usage-count", 0)
        match_score = match.get("match", 0)
        quality = match.get("quality", 0)
        if int(quality) < 50 or int(usage_count) < 3:
            continue
        candidates.append((translation, usage_count, match_score))
    if candidates:
        candidates.sort(key = lambda x: (-x[1], -x[2]))
        best_tran = candidates[0][0]
    return best_tran

def translate_to_ita(word):
    url = f"https://api.mymemory.translated.net/get?q={word}&langpair=en|it"
    response = requests.get(url)

    if response.status_code != 200:
        return word  

    data = response.json()
    return best_translation(data) or word

def fetch_synonyms(word, lang):
    url = f"https://api.conceptnet.io/c/{lang}/{word}?limit=10"
    response = requests.get(url)
    if response.status_code != 200:
        return []
    data = response.json()
    synonyms = set()

    for edge in data.get("edges", []):
        if edge.get("rel", {}).get("@id") in ["/r/Synonym", "/r/SimilarTo", "/r/RelatedTo"]:
            term = edge.get("end", {}).get("label")
            if term and term.lower() != word.lower():
                synonyms.add(term)
    return list(synonyms)

def get_synonyms(word):
    word_en = word.lower().replace(" ", "_")
    word_it = translate_to_ita(word_en).lower().replace(" ", "_")
    print(word_en, word_it)
    synonyms_en = fetch_synonyms(word_en, "en")
    synonyms_it = fetch_synonyms(word_it, "it")
    return list(set(synonyms_en + synonyms_it))

def generate_solution_synonyms(solution):
    solution = json.loads(solution)
    for element in solution.get("elements", []):
        if "name" in element and element["name"].strip():
            element["synonyms"] = get_synonyms(element["name"])
    return solution