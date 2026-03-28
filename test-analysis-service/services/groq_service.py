import os
import json
from groq import Groq

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

MODEL_70B = "llama-3.3-70b-versatile"
MODEL_8B = "llama-3.1-8b-instant"


def _extract_json(text, bracket="["):
    """Extract JSON from text that may contain markdown fences."""
    if "```" in text:
        opener = bracket
        closer = "]" if bracket == "[" else "}"
        start = text.find(opener)
        end = text.rfind(closer) + 1
        if start != -1 and end > start:
            return text[start:end]
    return text.strip()


def generate_questions(topics, difficulty, num_questions, question_type):
    type_desc = (
        "single correct answer MCQ"
        if question_type == "mcq"
        else "multi-select (multiple correct answers)"
    )

    prompt = f"""You are an expert exam creator.

Generate {num_questions} {difficulty} level {type_desc} questions from topics: {', '.join(topics)}.

Return ONLY a JSON array. No markdown, no code fences, no explanation.

Each question must include:
- question (string)
- options (array of 4 strings)
- correct_answer (string - must exactly match one of the options)
- explanation (string - detailed explanation of the correct answer)
- difficulty (string: easy/medium/hard)
- topic (string - which main topic this belongs to)
- subtopic (string - specific subtopic)
- expected_time_seconds (integer - realistic time to solve)
- hint (string - a helpful hint without giving away the answer)

Ensure questions are diverse, covering different subtopics. Make options realistic and plausible."""

    response = _get_client().chat.completions.create(
        model=MODEL_70B,
        messages=[
            {
                "role": "system",
                "content": "You are an expert exam question generator. Output ONLY valid JSON arrays. No markdown, no code fences, no extra text.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=4096,
    )

    raw = response.choices[0].message.content.strip()
    return _validate_and_fix_json(raw)


def _validate_and_fix_json(raw_json):
    cleaned = _extract_json(raw_json, "[")
    try:
        questions = json.loads(cleaned)
        if isinstance(questions, list) and len(questions) > 0:
            required = [
                "question", "options", "correct_answer", "explanation",
                "difficulty", "topic", "subtopic", "expected_time_seconds",
            ]
            if all(all(k in q for k in required) for q in questions):
                return questions
    except json.JSONDecodeError:
        pass

    fix_prompt = f"""The following text should be a valid JSON array of quiz questions but may be malformed.
Fix it and return ONLY a valid JSON array. No markdown, no code fences.

Each object must have: question, options (array of 4), correct_answer, explanation, difficulty, topic, subtopic, expected_time_seconds (int), hint.

Text to fix:
{raw_json}"""

    response = _get_client().chat.completions.create(
        model=MODEL_8B,
        messages=[
            {
                "role": "system",
                "content": "You fix malformed JSON. Output ONLY valid JSON. No markdown.",
            },
            {"role": "user", "content": fix_prompt},
        ],
        temperature=0.1,
        max_tokens=4096,
    )

    fixed = _extract_json(response.choices[0].message.content.strip(), "[")
    return json.loads(fixed)


def generate_insights(performance_data):
    prompt = f"""Analyze this student's test performance data:

{json.dumps(performance_data, indent=2)}

Give a concise analysis with:
1. Weak topics and why they are weak
2. What specific concepts to improve
3. A short study plan (3-5 bullet points)
4. Confidence level assessment (low/medium/high for each topic)

Return ONLY a JSON object with keys:
- weak_topics (array of objects with "topic" and "reason")
- improvements (array of strings)
- study_plan (array of strings)
- confidence (object mapping topic name to "low"/"medium"/"high")

No markdown, no code fences."""

    response = _get_client().chat.completions.create(
        model=MODEL_8B,
        messages=[
            {
                "role": "system",
                "content": "You are an educational analytics AI. Output ONLY valid JSON. No markdown.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=2048,
    )

    raw = _extract_json(response.choices[0].message.content.strip(), "{")
    return json.loads(raw)


def generate_report(questions, answers, analysis):
    summary = [
        {
            "question": q["question"][:120],
            "topic": q["topic"],
            "subtopic": q["subtopic"],
            "difficulty": q["difficulty"],
        }
        for q in questions
    ]

    prompt = f"""You are an expert educational analyst. Based on the following test data, generate a comprehensive performance report.

Data:
{json.dumps({"questions_summary": summary, "answers": answers, "analysis": analysis}, indent=2)}

Generate a detailed, personalized report with:
1. Overall assessment (2-3 sentences)
2. Strengths (what the student did well)
3. Weaknesses (specific topics/subtopics that need work, and WHY)
4. Time management analysis
5. Specific study recommendations with resources (YouTube channels, documentation, books)
6. Priority action items (ordered by importance)

Return ONLY a JSON object with keys:
- overall_assessment (string)
- strengths (array of strings)
- weaknesses (array of objects with "topic", "reason", "severity")
- time_analysis (string)
- recommendations (array of objects with "title", "description", "resources" array)
- action_items (array of strings)

No markdown, no code fences."""

    response = _get_client().chat.completions.create(
        model=MODEL_70B,
        messages=[
            {
                "role": "system",
                "content": "You are an expert educational analyst. Output ONLY valid JSON. No markdown, no code fences.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.4,
        max_tokens=3000,
    )

    raw = _extract_json(response.choices[0].message.content.strip(), "{")
    return json.loads(raw)
