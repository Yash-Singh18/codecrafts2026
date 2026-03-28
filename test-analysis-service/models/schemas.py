from pydantic import BaseModel
from typing import List, Optional


class TestConfig(BaseModel):
    topics: List[str]
    difficulty: str
    num_questions: int
    type: str


class Question(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str
    difficulty: str
    topic: str
    subtopic: str
    expected_time_seconds: int
    hint: Optional[str] = None


class TestGenerationResponse(BaseModel):
    questions: List[Question]


class AnswerRecord(BaseModel):
    question_index: int
    selected_answer: str
    correct: bool
    time_taken: int


class AnalysisRequest(BaseModel):
    questions: List[Question]
    answers: List[AnswerRecord]


class ReportRequest(BaseModel):
    questions: List[Question]
    answers: List[AnswerRecord]
    analysis: dict
