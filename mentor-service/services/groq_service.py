import os
import json
from groq import Groq

MODEL = "llama-3.3-70b-versatile"


def _get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


def _fmt_time(seconds):
    if not seconds:
        return "N/A"
    s = int(seconds)
    if s < 60:
        return f"{s}s"
    return f"{s // 60}m {s % 60}s"


def _build_system_prompt(user_context: dict) -> str:
    profile = user_context.get("profile") or {}
    attempts = user_context.get("test_attempts", [])

    username = profile.get("username") or "Student"
    grade = profile.get("grade") or ""
    full_name = profile.get("full_name") or ""

    scores = [a["score"] for a in attempts if a.get("score") is not None]
    avg_score = sum(scores) / len(scores) if scores else 0
    best_score = max(scores) if scores else 0

    topic_perf: dict = {}
    for a in attempts:
        for t in a.get("topics", []):
            topic_perf.setdefault(t, []).append(a["score"])

    topic_lines = "\n".join(
        f"  - {t}: {len(s)} test(s), avg {sum(s)/len(s):.1f}%"
        for t, s in sorted(topic_perf.items(), key=lambda x: sum(x[1])/len(x[1]))
    ) or "  None yet"

    history_lines = []
    for i, a in enumerate(attempts[-10:], 1):  # last 10 tests
        topics = ", ".join(a.get("topics", [])) or "Unknown"
        date = (a.get("created_at") or "")[:10]
        history_lines.append(
            f"  #{i}: {topics} | Score: {a['score']:.1f}% | "
            f"Difficulty: {a.get('difficulty','?')} | "
            f"Questions: {a.get('num_questions','?')} | "
            f"Time: {_fmt_time(a.get('total_time'))} | Date: {date}"
        )
    history_text = "\n".join(history_lines) or "  No tests taken yet."

    return f"""You are MentorAI — a warm, expert, and highly personalized academic mentor for a student.

STUDENT PROFILE:
- Name: {full_name or username}
- Username: @{username}{f" | Grade: {grade}" if grade else ""}
- Total Tests Taken: {len(attempts)}
- Average Score: {avg_score:.1f}%
- Best Score: {best_score:.1f}%

TOPIC PERFORMANCE (sorted by weakest first):
{topic_lines}

RECENT TEST HISTORY (last 10):
{history_text}

YOUR ROLE:
- You are their personal mentor — be warm, encouraging, and direct
- Reference their ACTUAL data when giving advice (e.g., "I see you scored 45% in Calculus last week...")
- Identify patterns: repeated low scores in a topic = needs focused work
- Give actionable, step-by-step study advice
- If they ask a conceptual question, explain it clearly with examples
- Celebrate their wins ("Your Physics score improved from 60% to 80%!")
- If no test history exists, encourage them to take their first test and explain what you'll be able to help with

FORMATTING — STRICTLY FOLLOW THESE RULES:
- NEVER write long paragraphs. Break everything into structured sections.
- Use ## headings to separate major sections (e.g., ## Overview, ## Weak Areas, ## Study Plan)
- Use **bold** to highlight topic names, scores, and key terms
- Use bullet lists (- item) for any list of 2+ items — never write lists as sentences
- Use numbered lists (1. step) for step-by-step plans or ordered advice
- Use > blockquote for a key takeaway or motivational line at the end
- Short paragraphs only — max 2 sentences per paragraph before breaking
- A good response looks like: heading → short intro → bullet list → another section → key takeaway
- For study plans, ALWAYS use a numbered list with specific actions

IMPORTANT: Never make up data. Only reference information visible in the student's actual history above."""


def chat_with_mentor(messages: list, user_context: dict):
    system_prompt = _build_system_prompt(user_context)

    api_messages = [{"role": "system", "content": system_prompt}]
    for m in messages:
        api_messages.append({"role": m["role"], "content": m["content"]})

    response = _get_client().chat.completions.create(
        model=MODEL,
        messages=api_messages,
        temperature=0.7,
        max_tokens=1024,
        stream=True,
    )

    for chunk in response:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
