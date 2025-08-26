import React, { useState } from "react";
import { jsPDF } from "jspdf";  // ✅ Import jsPDF

function App() {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert("Please upload a resume first!");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/upload_resume", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setSkills(data.skills);
  };

  const handleGenerateQuestions = async () => {
    const formData = new FormData();
    formData.append("skills", JSON.stringify(skills));
    formData.append("role", "Software Engineer");

    const res = await fetch("http://127.0.0.1:8000/generate_questions", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setQuestions(data.questions);
    setCurrentIndex(0);
    setFinished(false);
  };

  const handleAnswerChange = (q, value) => {
    setAnswers((prev) => ({ ...prev, [q]: value }));
  };

  const handleEvaluate = async (question) => {
    const res = await fetch("http://127.0.0.1:8000/evaluate_answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        answer: answers[question] || "",
        expected_keywords: skills,
      }),
    });
    const data = await res.json();
    setFeedbacks((prev) => ({ ...prev, [question]: data }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // ✅ Calculate overall score
  const calculateOverallScore = () => {
    const scores = Object.values(feedbacks).map((f) => f.score || 0);
    if (scores.length === 0) return 0;
    const total = scores.reduce((a, b) => a + b, 0);
    return (total / scores.length).toFixed(2); // average with 2 decimals
  };

  // ✅ PDF Download Function
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("AI Interview Report", 10, y);
    y += 10;

    doc.setFontSize(14);
    doc.text(`Overall Score: ${calculateOverallScore()}`, 10, y);
    y += 15;

    questions.forEach((q, i) => {
      doc.setFontSize(12);
      doc.text(`Q${i + 1}: ${q}`, 10, y);
      y += 8;

      doc.text(`Answer: ${answers[q] || "N/A"}`, 10, y);
      y += 8;

      if (feedbacks[q]) {
        doc.text(`Sentiment: ${feedbacks[q].sentiment}`, 10, y); y += 8;
        doc.text(`Keyword Coverage: ${feedbacks[q].keyword_coverage}`, 10, y); y += 8;
        doc.text(`Score: ${feedbacks[q].score}`, 10, y); y += 8;

        feedbacks[q].tips.forEach((tip, idx) => {
          doc.text(`- ${tip}`, 15, y);
          y += 8;
        });
      }

      y += 5;
      if (y > 270) {  // page break if text goes off page
        doc.addPage();
        y = 10;
      }
    });

    doc.save("interview_report.pdf");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>AI Interview Simulator</h1>

      {/* Upload Section */}
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Resume</button>

      {/* Skills Display */}
      {skills.length > 0 && !questions.length && (
        <div>
          <h2>Extracted Skills</h2>
          <ul>{skills.map((s, i) => <li key={i}>{s}</li>)}</ul>
          <button onClick={handleGenerateQuestions}>Start Interview</button>
        </div>
      )}

      {/* Interview Questions */}
      {!finished && questions.length > 0 && (
        <div>
          <h2>Question {currentIndex + 1} of {questions.length}</h2>
          <p><b>{questions[currentIndex]}</b></p>
          <textarea
            rows="3"
            cols="50"
            value={answers[questions[currentIndex]] || ""}
            onChange={(e) => handleAnswerChange(questions[currentIndex], e.target.value)}
            placeholder="Type your answer here..."
          />
          <br />
          <button onClick={() => handleEvaluate(questions[currentIndex])}>Evaluate Answer</button>

          {/* Show Feedback */}
          {feedbacks[questions[currentIndex]] && (
            <div style={{ marginTop: "10px", padding: "10px", border: "1px solid #ccc" }}>
              <h3>Feedback</h3>
              <p><b>Sentiment:</b> {feedbacks[questions[currentIndex]].sentiment}</p>
              <p><b>Keyword Coverage:</b> {feedbacks[questions[currentIndex]].keyword_coverage}</p>
              <p><b>Score:</b> {feedbacks[questions[currentIndex]].score}</p>
              <ul>
                {feedbacks[questions[currentIndex]].tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: "10px" }}>
            <button onClick={handlePrevious} disabled={currentIndex === 0}>
              Previous
            </button>
            <button onClick={handleNext}>
              {currentIndex === questions.length - 1 ? "Finish Interview" : "Next"}
            </button>
          </div>
        </div>
      )}

      {/* Final Report Page */}
      {finished && (
        <div>
          <h2>Interview Completed 🎉</h2>
          <h3>Overall Score: {calculateOverallScore()}</h3> {/* ✅ Added overall score */}
          <h3>Summary Report</h3>
          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: "15px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
              <p><b>Q{i + 1}: {q}</b></p>
              <p><b>Your Answer:</b> {answers[q]}</p>
              {feedbacks[q] && (
                <>
                  <p><b>Sentiment:</b> {feedbacks[q].sentiment}</p>
                  <p><b>Keyword Coverage:</b> {feedbacks[q].keyword_coverage}</p>
                  <p><b>Score:</b> {feedbacks[q].score}</p>
                  <b>Tips:</b>
                  <ul>
                    {feedbacks[q].tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}

          {/* ✅ Download PDF Button */}
          <button onClick={handleDownloadPDF}>Download Report as PDF</button>
        </div>
      )}
    </div>
  );
}

export default App;
