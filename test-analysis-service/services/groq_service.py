import os
import json
from groq import Groq

def _get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

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


def _fmt_time(seconds):
    """Convert seconds to a human-readable string."""
    s = int(seconds)
    if s < 60:
        return f"{s}s"
    return f"{s // 60}m {s % 60}s"


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

    # Build explicit human-readable time fields so the LLM can't misinterpret units
    overall = analysis.get("overall", {})
    topic_perf = analysis.get("topic_performance", {})

    time_context = {
        "total_time": _fmt_time(overall.get("total_time", 0)),
        "total_expected_time": _fmt_time(overall.get("total_expected_time", 0)),
        "per_topic": {
            topic: {
                "avg_time_per_question": _fmt_time(data["avg_time"]),
                "avg_expected_time_per_question": _fmt_time(data["avg_expected_time"]),
                "time_ratio": f"{data['time_ratio']}x expected",
            }
            for topic, data in topic_perf.items()
        },
    }

    prompt = f"""You are an expert educational analyst. Based on the following test data, generate a comprehensive performance report.

IMPORTANT: All times below are already formatted as human-readable strings (e.g. "1m 11s", "45s"). Use them exactly as given — do NOT convert or reinterpret them.

Data:
{json.dumps({"questions_summary": summary, "answers": answers, "analysis": analysis, "time_summary": time_context}, indent=2)}

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


def chat_with_context(messages, context):
    """Conversational chat with full test context, streamed."""
    context_summary = json.dumps(context, indent=2, default=str)

    system_prompt = f"""You are an expert tutor and study coach. The student just completed a test and you have their full results.

IMPORTANT: All time values in the context are in SECONDS. When mentioning times, always convert to human-readable format (e.g. 71 seconds = "1 minute 11 seconds", 45 seconds = "45 seconds").

TEST CONTEXT:
{context_summary}

RULES:
- You know every question they got right/wrong, their time per question, weak topics, and the full analysis.
- Be conversational, encouraging, and specific. Reference their actual test data.
- When they ask about a topic, explain concepts clearly with examples.
- If they ask "why did I get Q3 wrong", look up question 3 and explain.
- Keep responses concise but helpful. Use markdown formatting.
- You are their personal tutor - be warm and direct.

RESOURCES: Whenever you explain a concept or suggest study material, always include 2-3 relevant resource links at the end of your response using this exact markdown format:
📺 **Resources:**
- [Search YouTube: <topic> explained](https://www.youtube.com/results?search_query=<url-encoded-topic>+explained)
- [<Specific channel> on <topic>](https://www.youtube.com/results?search_query=<channel>+<url-encoded-topic>)
- [Google Scholar: <topic>](https://scholar.google.com/scholar?q=<url-encoded-topic>)

Replace <topic>, <channel>, and <url-encoded-topic> with real values (URL-encode spaces as +). Choose well-known channels like Khan Academy, 3Blue1Brown, MIT OpenCourseWare, freeCodeCamp, Numberphile, CrashCourse based on the subject. For math/science use 3Blue1Brown or Khan Academy. For programming use freeCodeCamp or Fireship. Always include at least one YouTube link and one Google Scholar link."""

    api_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        api_messages.append({"role": msg["role"], "content": msg["content"]})

    response = _get_client().chat.completions.create(
        model=MODEL_70B,
        messages=api_messages,
        temperature=0.6,
        max_tokens=1500,
        stream=True,
    )

    for chunk in response:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
