import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from models.schemas import ChatRequest
from services.groq_service import chat_with_mentor

router = APIRouter()


@router.post("/mentor/chat")
async def mentor_chat(req: ChatRequest):
    messages = [m.model_dump() for m in req.messages]
    context = {
        "profile": req.user_context.profile.model_dump() if req.user_context.profile else {},
        "test_attempts": [a.model_dump() for a in req.user_context.test_attempts],
    }

    def generate():
        for chunk in chat_with_mentor(messages, context):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
