from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pdfplumber
from fastapi import File
import nltk
import io

# Download VADER if missing
try:
    from nltk.sentiment import SentimentIntensityAnalyzer
except Exception:
    nltk.download("vader_lexicon")
    from nltk.sentiment import SentimentIntensityAnalyzer

sia = SentimentIntensityAnalyzer()

app = FastAPI(title="AI Interview Simulator")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Skills bank
SKILL_BANK = [
    "python", "java", "sql", "javascript", "react", "node", "django", "flask",
    "fastapi", "aws", "docker", "git", "linux", "data structures", "algorithms",
    "machine learning", "nlp", "pandas", "numpy", "rest api", "mongodb", "postgresql"
]

# -----------------------------
# Helpers
# -----------------------------
def extract_text_from_plainfile(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="ignore")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def find_skills(text: str) -> List[str]:
    text_low = text.lower()
    return sorted(list({s for s in SKILL_BANK if s in text_low}))

def generate_questions(skills: List[str], role: Optional[str] = None) -> List[str]:
    qs = [
        "Tell me about a challenging project and your specific impact.",
        "Describe a time you received constructive feedback and what you changed."
    ]
    for s in skills[:6]:  
        if s in ["python","java","javascript"]:
            qs.append(f"In {s}, how do you manage errors and exceptions in production?")
        elif s in ["sql","postgresql","mongodb"]:
            qs.append(f"Design a schema or query to fetch the top N records efficiently using {s}.")
        elif s == "react":
            qs.append("How do you manage state in React across complex components?")
        elif s in ["aws","docker"]:
            qs.append(f"Walk through deploying a small service with {s}.")
        elif s in ["machine learning","nlp","pandas","numpy"]:
            qs.append(f"Explain a pipeline you built using {s}, and how you validated results.")
        else:
            qs.append(f"What are best practices you follow when working with {s}?")
    if role:
        qs.append(f"What makes you a fit for the {role} role?")
    return qs

# -----------------------------
# Models
# -----------------------------
class AnswerIn(BaseModel):
    question: str
    answer: str
    expected_keywords: List[str] = []

# -----------------------------
# Routes
# -----------------------------
@app.get("/")
def root():
    return {"message": "Welcome to AI Interview Simulator API 🚀"}

@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    contents = await file.read()

    # Detect file type
    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(contents)
    else:
        text = contents.decode("utf-8", errors="ignore")

    # Extract skills
    skills = []
    for skill in ["Python", "Java", "React", "SQL", "Machine Learning"]:
        if skill.lower() in text.lower():
            skills.append(skill)

    return {"skills": skills, "resume_text": text[:500]}


@app.post("/generate_questions")
async def gen_qs(skills: List[str] = Form(...), role: str = Form(default="")):
    qs = generate_questions(skills, role or None)
    return {"questions": qs}

@app.post("/evaluate_answer")
async def evaluate(ans: AnswerIn):
    sentiment = sia.polarity_scores(ans.answer)["compound"]
    keywords = [k.lower() for k in ans.expected_keywords]
    words = ans.answer.lower()
    hit = sum(1 for k in keywords if k in words)
    coverage = 0.0 if not keywords else round(hit / len(keywords), 2)

    tips = []
    if sentiment < 0.1:
        tips.append("Sound more confident and positive.")
    if coverage < 0.5 and keywords:
        tips.append("Include more relevant keywords from your resume or the job description.")
    if len(ans.answer.split()) < 50:
        tips.append("Add concrete examples and outcomes (numbers, impact).")

    score = round(0.5 * max(sentiment, 0) + 0.5 * coverage, 2)

    return {
        "sentiment": sentiment,
        "keyword_coverage": coverage,
        "score": score,
        "tips": tips
    }
