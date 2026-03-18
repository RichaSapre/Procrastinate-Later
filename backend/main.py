import os
import time
import requests
from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Procrastinate Later API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

# AI Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

STATIC_FALLBACKS = {
    "too_long": "Open the task and set a timer for just 10 minutes. You are not allowed to finish it. You are only allowed to start.",
    "dont_know_where": "Write down the single next physical action in one sentence. Not the goal. The next action.",
    "distracted": "Put your phone in another room. Open only one tab. Set a 25 minute timer right now.",
    "doing_easier": "Close everything except this task. You have 5 minutes to do the hardest part first."
}

# --- Pydantic Models ---
class TaskCreate(BaseModel):
    title: str
    category: str  # DSA, Applications, Fitness, LinkedIn, College, Other
    estimated_minutes: int
    scheduled_time: str # HH:MM format

class ProcrastinationLogCreate(BaseModel):
    task_id: str
    reason: str # too_long, dont_know_where, distracted, doing_easier

# --- AI Fallback Logic ---
def get_ai_micro_action(reason: str) -> str:
    prompt = f"The user is procrastinating because: '{reason}'. Give them one single, tiny, immediate micro-action to start working on their task right now. Be direct, no fluff, one sentence."
    
    # Layer 1: Groq
    if GROQ_API_KEY:
        try:
            start_time = time.time()
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "llama3-70b-8192",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 50
                },
                timeout=8
            )
            if response.status_code == 200:
                print(f"Layer 1 (Groq) used. Time: {time.time() - start_time:.2f}s")
                return response.json()['choices'][0]['message']['content'].strip()
        except Exception as e:
            print(f"Layer 1 failed: {e}")

    # Layer 2: Gemini
    if GEMINI_API_KEY:
        try:
            start_time = time.time()
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            response = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                },
                timeout=8
            )
            if response.status_code == 200:
                print(f"Layer 2 (Gemini) used. Time: {time.time() - start_time:.2f}s")
                content = response.json()['candidates'][0]['content']['parts'][0]['text']
                return content.strip()
        except Exception as e:
            print(f"Layer 2 failed: {e}")

    # Layer 3: Static Fallback
    print("Layer 3 (Static Fallback) used.")
    return STATIC_FALLBACKS.get(reason, "Just start by opening the document and reading the first sentence.")

# --- Endpoints ---

@app.post("/tasks")
async def create_task(task: TaskCreate):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    # Ensure scheduled_time is compatible with potential timestamp columns
    scheduled_ts = task.scheduled_time
    if ":" in task.scheduled_time and len(task.scheduled_time) <= 5:
        # It's HH:MM, prepend today's date
        today_str = date.today().isoformat()
        scheduled_ts = f"{today_str}T{task.scheduled_time}:00"

    data = {
        "title": task.title,
        "category": task.category,
        "estimated_minutes": task.estimated_minutes,
        "scheduled_time": scheduled_ts,
        "status": "pending",
        "date": str(date.today()),
        "is_anchor": False
    }
    response = supabase.table("tasks").insert(data).execute()
    return response.data[0]

@app.get("/tasks/today")
async def get_tasks_today():
    if not supabase: return []
    response = supabase.table("tasks").select("*").eq("date", str(date.today())).execute()
    return response.data

@app.post("/tasks/start")
async def start_task(task_id: str = Body(..., embed=True)):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    data = {
        "actual_start": datetime.now().isoformat(),
        "status": "in_progress"
    }
    response = supabase.table("tasks").update(data).eq("id", task_id).execute()
    return response.data[0]

@app.post("/tasks/complete")
async def complete_task(task_id: str = Body(..., embed=True)):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    data = {
        "actual_end": datetime.now().isoformat(),
        "status": "completed"
    }
    response = supabase.table("tasks").update(data).eq("id", task_id).execute()
    return response.data[0]

@app.post("/procrastination-log")
async def log_procrastination(log: ProcrastinationLogCreate):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    micro_action = get_ai_micro_action(log.reason)
    data = {
        "task_id": log.task_id,
        "reason": log.reason,
        "micro_action": micro_action,
        "timestamp": datetime.now().isoformat()
    }
    supabase.table("procrastination_logs").insert(data).execute()
    return {"micro_action": micro_action}

@app.get("/report/weekly")
async def get_weekly_report():
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    
    # Calculate this week's start (Monday)
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    
    # Fetch tasks and logs from start of week
    tasks_res = supabase.table("tasks").select("*").gte("date", start_of_week.isoformat()).execute()
    logs_res = supabase.table("procrastination_logs").select("*").gte("timestamp", start_of_week.isoformat()).execute()
    
    tasks = tasks_res.data
    logs = logs_res.data
    
    completed_dsa = sum(1 for t in tasks if t['category'] == 'DSA' and t['status'] == 'completed')
    completed_apps = sum(1 for t in tasks if t['category'] == 'Applications' and t['status'] == 'completed')
    
    # Calculate most common reason
    reasons = {}
    for log in logs:
        r = log.get('reason', 'unknown')
        reasons[r] = reasons.get(r, 0) + 1
    most_common_reason = max(reasons, key=reasons.get) if reasons else "None"
    
    # Simple summary generation
    summary = f"This week you completed {completed_dsa} DSA sessions but submitted {completed_apps} job applications. "
    if completed_apps == 0:
        summary += "At this rate you will have applied to zero companies by the end of the month."
    else:
        summary += f"You're making progress. Keep it up."
        
    return {
        "week_title": f"Week of {start_of_week.strftime('%b %d')}",
        "summary": summary,
        "metrics": [
            {"label": "DSA Sessions Completed", "value": completed_dsa},
            {"label": "Job Apps Submitted", "value": completed_apps},
            {"label": "Procrastination Logs", "value": len(logs)},
            {"label": "Most Common Reason", "value": most_common_reason.replace("_", " ")}
        ]
    }

@app.get("/streaks")
async def get_streaks():
    if not supabase: return []
    # Fetch last 30 days of data
    start_point = (date.today() - timedelta(days=30)).isoformat()
    tasks_res = supabase.table("tasks").select("date", "category", "status").gte("date", start_point).execute()
    logs_res = supabase.table("procrastination_logs").select("timestamp", "task_id").gte("timestamp", start_point).execute()
    
    # Group by category
    categories = ["DSA", "Applications", "Fitness", "LinkedIn", "College", "Other"]
    result = []
    
    for cat in categories:
        cat_tasks = [t for t in tasks_res.data if t['category'] == cat]
        days = []
        for i in range(28):
            day_date = (date.today() - timedelta(days=27-i))
            day_str = day_date.isoformat()
            
            day_task = next((t for t in cat_tasks if t['date'] == day_str), None)
            has_log = any(l['timestamp'].startswith(day_str) for l in logs_res.data)
            
            status = 'none'
            if day_task:
                status = 'completed' if day_task['status'] == 'completed' else 'missed'
            
            days.append({"id": i, "date": day_str, "status": status, "hasLog": has_log})
            
        result.append({
            "name": cat,
            "days": days,
            "lastCompleted": "Never", # Or calculate
            "avoided": sum(1 for d in days if d['status'] == 'missed')
        })
        
    return result

@app.post("/anchor")
async def set_anchor(task_id: str = Body(..., embed=True)):
    if not supabase: raise HTTPException(status_code=500, detail="Supabase not configured")
    # Mark all others as not anchor for today first (optional but safe)
    supabase.table("tasks").update({"is_anchor": False}).eq("date", str(date.today())).execute()
    response = supabase.table("tasks").update({"is_anchor": True}).eq("id", task_id).execute()
    return response.data[0]

@app.get("/anchor/today")
async def get_anchor_today():
    if not supabase: return None
    response = supabase.table("tasks").select("*").eq("date", str(date.today())).eq("is_anchor", True).execute()
    return response.data[0] if response.data else None

@app.get("/stats/categories")
async def get_category_stats():
    if not supabase: return []
    categories = ["DSA", "Applications", "Fitness", "LinkedIn", "College", "Other"]
    stats = []
    
    for cat in categories:
        # Get last completed task for this category
        res = supabase.table("tasks").select("date").eq("category", cat).eq("status", "completed").order("date", desc=True).limit(1).execute()
        
        last_done = "Never"
        if res.data:
            last_date = date.fromisoformat(res.data[0]['date'])
            diff = (date.today() - last_date).days
            if diff == 0: last_done = "Today"
            elif diff == 1: last_done = "Yesterday"
            else: last_done = f"{diff} days ago"
        
        stats.append({
            "id": cat,
            "name": cat.lower(),
            "lastDone": last_done
        })
    
    return stats

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
