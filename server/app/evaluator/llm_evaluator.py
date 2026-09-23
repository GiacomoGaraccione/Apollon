import json
import re
import os
from pathlib import Path
import anthropic

SYSTEM_PROMPT = (Path(__file__).parent / "prompts" / "system_prompt.md").read_text(encoding="utf-8")


def _extract_json(raw):
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    fence_match = re.search(r"```(?:json)?\s*\n(.*?)\n\s*```", raw, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from LLM response:\n{raw[:1000]}")


def evaluate_with_llm(reference, student_model):
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    user_message = (
        "Reference solution:\n```json\n"
        + json.dumps(reference, ensure_ascii=False)
        + "\n```\n\nStudent diagram:\n```json\n"
        + json.dumps(student_model, ensure_ascii=False)
        + "\n```\n\nRespond with ONLY the JSON evaluation object. No text before or after."
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    total_tokens = response.usage.input_tokens + response.usage.output_tokens
    raw = response.content[0].text.strip()
    result = _extract_json(raw)

    return result, total_tokens
