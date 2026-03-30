# Rigel — AI-Powered Career & Learning Platform

Rigel is a full-stack web application that combines AI-driven test analysis, personalized mentorship, career roadmapping, and focused learning tools — all in one place.

---

## Features

### Test Analysis
Upload your exam results or practice test data and get deep AI-generated insights: topic-level breakdowns, performance trends, and a personalized improvement plan with actionable recommendations.

### Mentor AI
A persistent conversational AI tutor accessible from any page. Ask questions, get explanations, work through problems, or explore topics — full markdown + code rendering with streaming responses.

### Career Guide
An interactive visual roadmap built with React Flow. Describe your career goal and get a graph of skills, milestones, and learning paths — with an integrated AI chat to guide you through it.

### Focus Zone
Upload any PDF (textbook, notes, paper) and get an AI-generated structured breakdown — key concepts, chapter summaries, and an interactive topic tree to navigate your material.

### Community
A discussion forum where users share insights, ask questions, and discuss topics. Supports tags, search, and a real-time-style chat interface.

### Profile
Tracks your test history, activity heatmap, topic performance, and generates a learner persona based on your usage patterns.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7 |
| Styling | Plain CSS with CSS custom properties |
| Animations | Framer Motion |
| Graph / Flow | React Flow (@xyflow/react) |
| Charts | Recharts |
| Markdown | react-markdown + rehype-katex + remark-math |
| AI (frontend) | Groq SDK (streaming) |
| Database | Supabase (PostgreSQL + Auth) |
| Auth | Google OAuth via Supabase |
| Backend (test analysis) | Python service on Railway |
| Backend (mentor) | Python service on Railway |
| Container | Docker + Docker Compose |

---

## Project Structure

```
rigel/
├── frontend/                  # React + Vite SPA
│   └── src/
│       ├── pages/
│       │   ├── home/          # Landing page
│       │   ├── test-analysis/ # Test engine + results dashboard
│       │   ├── focus-zone/    # PDF analysis + topic tree
│       │   ├── career-guide/  # Interactive roadmap graph
│       │   ├── community/     # Discussion feed + chat
│       │   └── profile/       # User stats + heatmap
│       ├── components/
│       │   ├── MentorAI/      # Floating AI chat widget
│       │   └── Navbar/        # Top navigation
│       └── services/          # Supabase, Groq, API clients
├── mentor-service/            # Python AI mentor backend
├── test-analysis-service/     # Python test analysis backend
├── supabase/                  # DB migrations
└── docker-compose.yml         # Local orchestration
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project
- A [Groq](https://console.groq.com) API key

### Local Development

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd rigel
   ```

2. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env        # fill in your keys
   npm install
   npm run dev
   ```

3. **Backend services** (optional, for test analysis and mentor endpoints)
   ```bash
   docker compose up backend mentor
   ```

### Environment Variables

Create `frontend/.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GROQ_API_KEY=...
VITE_TEST_ANALYSIS_API_URL=https://your-backend.railway.app
VITE_MENTOR_API_URL=https://your-mentor.railway.app
```

---

## Deployment

The project deploys to [Railway](https://railway.app) with three separate services:

- `frontend` — static Vite build served via nginx
- `test-analysis-service` — Python API
- `mentor-service` — Python API

The frontend proxies `/api/test-analysis` and `/api/mentor` to the respective backend services at runtime.

---

## License

MIT
