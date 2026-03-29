import os
import json
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse

router = APIRouter()

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_LARGE_MODEL = "llama-3.3-70b-versatile"


def _api_key():
    return os.getenv("GROQ_API_KEY", "")


def _build_prompt(selection: dict) -> str:
    if selection.get("kind") == "edge":
        return "\n".join(filter(None, [
            f'Cross-domain career link: "{selection.get("sourceLabel")}" → "{selection.get("targetLabel")}"',
            f'Link name: {selection.get("label")}',
            f'Context: {selection.get("description")}' if selection.get("description") else "",
            "Instructions:",
            "1. In 2-3 sentences, explain how mastering the SOURCE subject makes students significantly more effective in the TARGET field.",
            "2. Give one specific real-world example of a professional who leveraged this exact cross-domain skill.",
            "3. Give one actionable step a student can take TODAY to start building this bridge.",
            "Keep it motivating, concrete, and under 120 words total.",
        ]))

    connected = selection.get("connectedLabels", [])
    return "\n".join(filter(None, [
        f'Career node: "{selection.get("label")}"',
        f'Stage in roadmap: {selection.get("level")}' if selection.get("level") else "",
        f'Typical duration: {selection.get("duration")}' if selection.get("duration") else "",
        f'Description: {selection.get("description")}' if selection.get("description") else "",
        f'Leads to or connects with: {", ".join(connected[:5])}' if connected else "",
        "Instructions:",
        "1. Explain why this is a crucial milestone for an Indian student in 2-3 sentences.",
        "2. Describe what specific skills or exams the student needs to clear to reach this node.",
        "3. Mention 1-2 top career outcomes or salary benchmarks a student can expect after mastering this.",
        "4. Keep it motivating, direct, and under 130 words.",
    ]))


def _build_graph_prompt(prompt: str) -> str:
    return "\n".join([
        "Generate a detailed Indian student roadmap as strict JSON only.",
        '{ "nodes": [{ "id": "string", "label": "string", "type": "nexus|stream|domain|career", "domain": "science|commerce|arts", "parentId": "string", "level": "basics|core|strong", "description": "string", "icon": "string", "duration": "string" }], "edges": [{ "id": "string", "source": "string", "target": "string", "type": "default|impactEdge", "label": "string", "description": "string" }] }',
        "Rules:",
        "1. Include exactly one root nexus node that represents the student goal.",
        "2. Use only the domains science, commerce, and arts.",
        "3. Include at least 14 nodes total and enough parentId links to form a roadmap.",
        "4. Impact edges should be used only for cross-domain bridges.",
        "5. Make the roadmap concrete and explorable for Indian students.",
        "6. Prefer clear parent-child progression: stream -> foundation -> path -> career outcome.",
        "7. Use concise labels and useful descriptions.",
        "8. Return raw JSON only. No markdown, no explanation.",
        f"User request: {prompt}",
    ])


def _domain_system_prompt(domain: str | None) -> str:
    if not domain:
        return (
            "You are an expert Indian academic and career roadmap strategist. "
            "Help students understand streams, sub-streams, entrance exams, degrees, and career outcomes. "
            "When describing roadmaps, use the format: Step A -> Step B -> Step C where useful. "
            "Be concrete, student-friendly, and concise. Max 160 words per response."
        )
    prompts = {
        "science": (
            "You are an expert Indian STEM career counsellor specialising in Science students. "
            "You know IIT-JEE, NEET, GATE, NDA, B.Tech, MBBS, M.Tech, AI/ML careers and research. "
            "When describing roadmaps, use the format: Step A -> Step B -> Step C so the UI can render flow-style chains. "
            "Always mention specific exams, institutes, and realistic salary ranges in INR. "
            "Be encouraging, specific, and concise. Max 150 words per response."
        ),
        "commerce": (
            "You are an expert Indian Commerce career counsellor. "
            "You know CA, MBA (CAT/GMAT), banking (IBPS, SBI PO, RBI), LLB, BBA, B.Com, and entrepreneurship. "
            "When describing roadmaps, use the format: Step A -> Step B -> Step C so the UI can render flow-style chains. "
            "Always mention specific exams, institutes, and realistic salary ranges in INR. "
            "Be encouraging, specific, and concise. Max 150 words per response."
        ),
        "arts": (
            "You are an expert Indian Humanities and Arts career counsellor. "
            "You know UPSC/IAS, UX Design, Journalism, Psychology, Law (CLAT), and Mass Communication. "
            "When describing roadmaps, use the format: Step A -> Step B -> Step C so the UI can render flow-style chains. "
            "Always mention specific exams, institutes, and realistic salary ranges in INR. "
            "Be encouraging, specific, and concise. Max 150 words per response."
        ),
    }
    return prompts.get(domain, prompts["science"])


# ── /api/groq/generate-graph ──────────────────────────────────────

@router.post("/groq/generate-graph")
async def generate_graph(request: Request):
    payload = await request.json()
    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        return JSONResponse({"error": "Prompt is required."}, status_code=400)

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"},
            json={
                "model": GROQ_LARGE_MODEL,
                "temperature": 0.3,
                "messages": [
                    {"role": "system", "content": "You generate valid JSON roadmaps for interactive learning graphs. Output only JSON and keep ids concise."},
                    {"role": "user", "content": _build_graph_prompt(prompt)},
                ],
            },
        )

    if resp.status_code != 200:
        return JSONResponse({"error": resp.text}, status_code=resp.status_code)

    raw = resp.json()["choices"][0]["message"]["content"]
    start, end = raw.find("{"), raw.rfind("}")
    graph = json.loads(raw[start:end + 1])
    return JSONResponse({"graph": graph})


# ── /api/groq/stream ──────────────────────────────────────────────

@router.post("/groq/stream")
async def groq_stream(request: Request):
    payload = await request.json()
    mode = payload.get("mode", "selection")

    if mode == "chat":
        messages = [
            {"role": "system", "content": _domain_system_prompt(payload.get("domain"))},
            *[{"role": m["role"], "content": m["content"]} for m in payload.get("history", [])],
        ]
    else:
        messages = [
            {"role": "system", "content": "You are a friendly, expert Indian academic career counsellor. Give specific, actionable guidance. Be encouraging, concrete, and focused on real outcomes. Always mention India-specific exams, institutes, or salary ranges where relevant."},
            {"role": "user", "content": _build_prompt(payload.get("selection", {}))},
        ]

    async def stream_groq():
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {_api_key()}", "Content-Type": "application/json"},
                json={"model": GROQ_LARGE_MODEL, "stream": True, "temperature": 0.4, "messages": messages},
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if not data or data == "[DONE]":
                        continue
                    parsed = json.loads(data)
                    content = parsed["choices"][0]["delta"].get("content")
                    if content:
                        yield content

    return StreamingResponse(stream_groq(), media_type="text/plain; charset=utf-8")
