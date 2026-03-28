add this "Test Analysis" in navbar and create a whole new page which does this:
create it as a different service without changing anything else and make its entire backend and ai part in a whole new folder altogether

🔥 CORE IDEA (clean pitch)

AI-powered adaptive testing system that not only evaluates performance but diagnoses weak concepts and prescribes improvement paths using visual learning graphs

🏗️ FULL SYSTEM ARCHITECTURE
⚙️ 1. INPUT MODULE (Frontend)

User inputs:

Topics (multi-select / text)
Difficulty (Easy / Medium / Hard)
No. of questions
Question type:
MCQ (single correct)
Multi-select

👉 Store as:

{
  "topics": ["OS", "DBMS"],
  "difficulty": "medium",
  "num_questions": 10,
  "type": "mcq"
}
🤖 2. TEST GENERATION SERVICE (LLM CORE)

Use:

Groq (LLaMA 3 70B) 
🔥 Prompt (IMPORTANT — THIS IS YOUR SYSTEM’S HEART)

Force structured + useful metadata:

You are an expert exam creator.

Generate {num_questions} of {difficulty} level questions from topics: {topics}.

Return ONLY JSON.

Each question must include:
- question
- options (array)
- correct_answer
- explanation
- difficulty (easy/medium/hard)
- topic
- subtopic
- expected_time_seconds
- hint
📦 Output Example
[
  {
    "question": "What is a deadlock?",
    "options": ["A", "B", "C", "D"],
    "correct_answer": "A",
    "explanation": "...",
    "difficulty": "medium",
    "topic": "OS",
    "subtopic": "Deadlocks",
    "expected_time_seconds": 45
  }
]
🧪 3. TEST ENGINE (IMPORTANT — MAKE THIS GOOD)

This is where most teams fail.

Track:
Time taken per question
Correct / incorrect
Option chosen
Tab switching (optional advanced)
Camera monitoring (optional — only if allowed)

👉 Store per attempt:

{
  "question_id": 1,
  "selected_answer": "B",
  "correct": false,
  "time_taken": 60
}
📊 4. ANALYSIS ENGINE (THIS WINS YOU THE HACKATHON)
This should be really visual - like a graph with nodes and edges.
Now we go beyond basic stats.

Build:
🔹 A. Topic-wise Performance
Accuracy per topic
Avg time vs expected time
🔹 B. Weakness Detection

Rule-based + LLM combo:

User is weak in topics where:
- accuracy < 60%
- OR time_taken > expected_time * 1.5
🧠 5. AI INSIGHT GENERATION

Send performance data to LLM:

Analyze this student's performance.

Give:
1. Weak topics
2. Why they are weak
3. What to improve
4. Study plan (short)
5. Resources (YouTube / docs)
6. Confidence level
📈 6. VISUAL DASHBOARD (THIS IS YOUR WOW FACTOR)
🔥 Graphs to include:
1. Topic Graph (IMPORTANT)
Nodes = topics
Color = performance (red → green)
4

👉 Clicking node:

Shows:
mistakes
explanations
resources
2. Time vs Accuracy Graph
X = questions
Y = time taken
Overlay correctness
3. Radar Chart
Shows skill across topics
4


🎯 7. REPORT GENERATOR (LLM POWERED - llm gets all the context)

Final report like:

“You are strong in DBMS indexing but weak in joins”
“You take 40% more time than expected in OS scheduling”
“Focus on X before Y”


🧱 TECH STACK (keep it realistic)
Frontend
React + Tailwind
Charts:
Recharts OR Chart.js
D3.js (if you want to impress judges 🔥)
Backend
FastAPI / Node.js and Supabase if we dont need this
DB
Supabase (you already using it)
store users
test attempts
questions
LLM
Groq (fast af)
Model: LLaMA 3 70Bs



all models are via groq

1. Test generater:
 - llama 70b generates the test
 - llama 8b model to validate the json format is correct and fix if needed & verify answers too


2. Analysis Engine (groq 70b agian):
 - rule based for accuracy and time
 - llm for reasoning 

3. Report generator 
 - llama 70b

4. realtime tracking - on frontend + backend logging

basically :
Task	Model
Test Generation	LLaMA 3 70B (Groq)
JSON Fix / Validation	LLaMA 3 8B
Analysis	LLaMA 3 8B
Report Generation	LLaMA 3 70B
Embeddings (RAG)	bge-small / e5-small
Vector DB	Qdrant


User Input
   ↓
LLaMA 70B → Generate Questions
   ↓
LLaMA 8B → Fix JSON + Validate
   ↓
Frontend Test Engine
   ↓
Rule-based Analysis
   ↓
LLaMA 8B → Insights
   ↓
LLaMA 70B → Final Report

Use:

system prompt (strict JSON rules)
user prompt (topics + difficulty)


