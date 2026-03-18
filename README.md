# Procrastinate Later

A full-stack anti-procrastination web application. Built for deep work and brutal honesty.

## Features

- **Daily Anchor Task**: Define the one thing that matters today.
- **AI-Driven Micro-Actions**: Procrastinating? Get a single, tiny, immediate action from Groq (Llama 3) or Gemini (Flash) or a static fallback.
- **Brutally Honest Reports**: Weekly AI-generated honest summaries of your productivity (or lack thereof).
- **Streak Tracker**: A no-nonsense calendar showing exactly which categories you missed.
- **Night Owl Mode**: Activate after 9 PM. Glows amber and dims everything but the absolute priorities.
- **Worn Notebook Design**: A premium, grounded aesthetic using Playfair Display and Lora on cream paper with a subtle grain texture. No border radius, no softness.

## Project Structure

- `backend/`: FastAPI server with Supabase integration and 3-layer AI fallback.
- `frontend/`: React application with Vite, built against a custom design system.
- `.github/workflows/`: Automated CI/CD for both frontend and backend.

## Getting Started

### Backend Setup

1. `cd backend`
2. `pip install -r requirements.txt`
3. Create a `.env` file referencing `.env.example`:
   ```env
   SUPABASE_URL=...
   SUPABASE_KEY=...
   GROQ_API_KEY=...
   GEMINI_API_KEY=...
   ```
4. `python main.py` (Server runs on port 8000)

### Frontend Setup

1. `cd frontend`
2. `npm install`
3. Create a `.env` file referencing `.env.example`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. `npm run dev`

## Built With

- **Backend**: Python FastAPI, Supabase, Groq API, Gemini API.
- **Frontend**: React, Vite, Vanilla CSS.
- **Infrastructure**: GitHub Actions CI/CD.

Developed for **Procrastinate Later** by Richa Nitin Sapre.
# Procrastinate-Later
