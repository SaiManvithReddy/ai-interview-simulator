# 🎯 AI Interview Simulator

An interactive **AI-powered interview simulator** built with **React** (frontend) and **FastAPI** (backend).  
Upload your resume, generate skill-based interview questions, answer them, receive real-time feedback, and download a **personalized interview report (PDF)**.  

---

## 🚀 Features
- 📄 Upload your resume and automatically extract skills.
- ❓ Generate personalized interview questions based on your skills & role.
- ✍️ Answer questions in real-time.
- 🤖 AI evaluates answers:
  - Sentiment analysis  
  - Keyword coverage  
  - Scoring system  
  - Improvement tips
- 📊 Get a **summary report** at the end of the interview.
- 🖨️ Download your performance report as a PDF.

---

## 🛠️ Tech Stack
**Frontend**  
- ⚛️ React  
- 🎨 Tailwind CSS (for styling, optional)  
- 📄 jsPDF (for report generation)  

**Backend**  
- ⚡ FastAPI  
- 🐍 Python  
- 🔍 NLP & sentiment analysis libraries  

---

## 📂 Project Structure
AI-Interview-Simulator/
│── backend/ # FastAPI server
│ ├── main.py # API endpoints
│ ├── requirements.txt # Python dependencies
│
│── frontend/ # React app
│ ├── src/
│ │ ├── App.js # Main React component
│ │ ├── index.js # Entry point
│ │ └── styles.css # Styles (optional)
│
│── README.md # Project documentation



---

## ⚡ Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/AI-Interview-Simulator.git
cd AI-Interview-Simulator


cd backend
pip install -r requirements.txt
uvicorn main:app --reload

cd frontend
npm install
npm start
