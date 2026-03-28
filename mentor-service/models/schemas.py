from pydantic import BaseModel
from typing import List, Optional, Any, Dict


class Message(BaseModel):
    role: str
    content: str


class TestAttempt(BaseModel):
    id: Optional[str] = None
    topics: List[str] = []
    difficulty: Optional[str] = None
    num_questions: Optional[int] = None
    question_type: Optional[str] = None
    score: float = 0
    total_time: Optional[int] = None
    created_at: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None


class Profile(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    grade: Optional[str] = None


class UserContext(BaseModel):
    profile: Optional[Profile] = None
    test_attempts: List[TestAttempt] = []


class ChatRequest(BaseModel):
    messages: List[Message]
    user_context: UserContext
