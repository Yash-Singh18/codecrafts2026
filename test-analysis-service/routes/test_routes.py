from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import TestConfig, AnalysisRequest, ReportRequest, ChatRequest
from services.groq_service import generate_questions, generate_insights, generate_report, chat_with_context
from services.analysis_service import analyze_performance

router = APIRouter()


@router.post("/generate-test")
async def create_test(config: TestConfig):
    try:
        questions = generate_questions(
            config.topics, config.difficulty, config.num_questions, config.type
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_test(request: AnalysisRequest):
    try:
        questions_dict = [q.model_dump() for q in request.questions]
        answers_dict = [a.model_dump() for a in request.answers]

        analysis = analyze_performance(questions_dict, answers_dict)
        insights = generate_insights(analysis)

        return {**analysis, "insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/report")
async def generate_test_report(request: ReportRequest):
    try:
        questions_dict = [q.model_dump() for q in request.questions]
        answers_dict = [a.model_dump() for a in request.answers]

        report = generate_report(questions_dict, answers_dict, request.analysis)
        return {"report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat(request: ChatRequest):
    import re as _re
    messages = [m.model_dump() for m in request.messages]

    def stream():
        sent_anything = False
        try:
            for token in chat_with_context(messages, request.context):
                sent_anything = True
                yield token
        except BaseException as e:
            err = str(e)
            if "rate_limit_exceeded" in err or "429" in err:
                wait = _re.search(r'try again in (.+?)\.', err)
                wait_str = wait.group(1) if wait else "a few minutes"
                yield f"\n\n⚠️ The AI is temporarily rate-limited. Please try again in {wait_str}."
            elif not sent_anything:
                yield f"⚠️ Something went wrong: {err}"
            else:
                yield f"\n\n⚠️ Something went wrong: {err}"

    return StreamingResponse(stream(), media_type="text/plain")
