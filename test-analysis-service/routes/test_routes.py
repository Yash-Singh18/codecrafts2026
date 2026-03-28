from fastapi import APIRouter, HTTPException
from models.schemas import TestConfig, AnalysisRequest, ReportRequest
from services.groq_service import generate_questions, generate_insights, generate_report
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
