import jsPDF from "jspdf";

interface SessionData {
  userName: string;
  date: string;
  jobRole: string;
  atsScore: number;
  skillsFound: string[];
  skillsMissing: string[];
  recommendation: string;
  questions: Array<{
    category: string;
    question_text: string;
    difficulty: string;
    question_type: string;
    answer?: { answer_text: string; confidence_score: number; feedback_text: string; sample_answer: string; weak_areas: string[] };
  }>;
  mcqResults?: { total_questions: number; correct_answers: number; score_percentage: number; weakest_topic?: string };
}

export const generateSessionPdf = (data: SessionData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > 270) { doc.addPage(); y = 20; }
  };

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Resumiq Session Report", margin, y);
  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`${data.userName} • ${data.date}`, margin, y);
  y += 6;
  doc.text(`Role: ${data.jobRole}`, margin, y);
  y += 12;

  // ATS Score
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`ATS Match Score: ${data.atsScore}/100`, margin, y);
  y += 8;

  if (data.skillsFound.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Skills Found:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const found = doc.splitTextToSize(data.skillsFound.join(", "), contentWidth);
    doc.text(found, margin, y);
    y += found.length * 5 + 4;
  }

  if (data.skillsMissing.length > 0) {
    checkPage(15);
    doc.setFont("helvetica", "bold");
    doc.text("Skills to Add:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const missing = doc.splitTextToSize(data.skillsMissing.join(", "), contentWidth);
    doc.text(missing, margin, y);
    y += missing.length * 5 + 4;
  }

  if (data.recommendation) {
    checkPage(20);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendation:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const rec = doc.splitTextToSize(data.recommendation, contentWidth);
    doc.text(rec, margin, y);
    y += rec.length * 5 + 4;
  }

  // Separator
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Open-ended questions grouped by category
  const openEnded = data.questions.filter(q => q.question_type === "open_ended");
  const categories = [...new Set(openEnded.map(q => q.category))];

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Interview Questions", margin, y);
  y += 10;

  categories.forEach(cat => {
    checkPage(15);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 120, 80);
    doc.text(cat, margin, y);
    y += 7;
    doc.setTextColor(0, 0, 0);

    const catQs = openEnded.filter(q => q.category === cat);
    catQs.forEach((q, i) => {
      checkPage(30);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const qLines = doc.splitTextToSize(`${i + 1}. [${q.difficulty}] ${q.question_text}`, contentWidth);
      doc.text(qLines, margin, y);
      y += qLines.length * 5 + 2;

      if (q.answer) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);

        const ans = doc.splitTextToSize(`Your Answer: ${q.answer.answer_text}`, contentWidth - 5);
        checkPage(ans.length * 5 + 5);
        doc.text(ans, margin + 5, y);
        y += ans.length * 5 + 2;

        doc.text(`Confidence: ${q.answer.confidence_score}/100`, margin + 5, y);
        y += 5;

        if (q.answer.feedback_text) {
          const fb = doc.splitTextToSize(`Feedback: ${q.answer.feedback_text}`, contentWidth - 5);
          checkPage(fb.length * 5 + 5);
          doc.text(fb, margin + 5, y);
          y += fb.length * 5 + 2;
        }

        if (q.answer.sample_answer) {
          const sa = doc.splitTextToSize(`Strong Answer: ${q.answer.sample_answer}`, contentWidth - 5);
          checkPage(sa.length * 5 + 5);
          doc.text(sa, margin + 5, y);
          y += sa.length * 5 + 2;
        }

        if (q.answer.weak_areas?.length > 0) {
          doc.text(`Weak Areas: ${q.answer.weak_areas.join(", ")}`, margin + 5, y);
          y += 5;
        }

        doc.setTextColor(0, 0, 0);
      }
      y += 4;
    });
    y += 4;
  });

  // MCQ Section
  const mcqs = data.questions.filter(q => q.question_type === "mcq");
  if (mcqs.length > 0) {
    checkPage(20);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("MCQ Quiz Results", margin, y);
    y += 8;

    if (data.mcqResults) {
      doc.setFontSize(11);
      doc.text(`Score: ${data.mcqResults.correct_answers}/${data.mcqResults.total_questions} (${Math.round(data.mcqResults.score_percentage)}%)`, margin, y);
      y += 6;
      if (data.mcqResults.weakest_topic) {
        doc.setFont("helvetica", "normal");
        doc.text(`Weakest Topic: ${data.mcqResults.weakest_topic}`, margin, y);
        y += 8;
      }
    }

    mcqs.forEach((q, i) => {
      checkPage(35);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      const qLines = doc.splitTextToSize(`${i + 1}. ${q.question_text}`, contentWidth);
      doc.text(qLines, margin, y);
      y += qLines.length * 5 + 3;

      const options = (q as any).options as Record<string, string> | undefined;
      const correctAnswer = (q as any).correct_answer as string | undefined;
      const optionKeys = ["A", "B", "C", "D"];

      if (options) {
        optionKeys.forEach(letter => {
          const optionText = options[letter];
          if (!optionText) return;
          checkPage(8);
          const isCorrect = letter === correctAnswer;
          doc.setFont("helvetica", isCorrect ? "bold" : "normal");
          doc.setTextColor(80, 80, 80);
          const prefix = isCorrect ? `★ ${letter})` : `   ${letter})`;
          const line = doc.splitTextToSize(`${prefix} ${optionText}`, contentWidth - 10);
          doc.text(line, margin + 5, y);
          y += line.length * 5 + 1;
        });
      }

      doc.setTextColor(0, 0, 0);
      y += 4;
    });
  }

  // Weak areas summary
  const allWeakAreas = openEnded
    .filter(q => q.answer?.weak_areas?.length)
    .flatMap(q => q.answer!.weak_areas);
  const uniqueWeak = [...new Set(allWeakAreas)];
  if (uniqueWeak.length > 0) {
    checkPage(20);
    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Weak Areas Summary", margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    uniqueWeak.forEach(w => {
      checkPage(8);
      doc.text(`• ${w}`, margin + 5, y);
      y += 6;
    });
  }

  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`Resumiq-Session-${dateStr}.pdf`);
};
