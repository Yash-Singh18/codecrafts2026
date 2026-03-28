from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes.test_routes import router as test_router

load_dotenv()

app = FastAPI(title="Test Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(test_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
