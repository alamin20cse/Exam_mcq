# MCQ Exam Platform (MERN + Firebase)

A full-stack MCQ exam platform:
- Admin: create exams, set duration + a 24h (or any) availability window, add/edit/delete MCQ questions (4 options each), manage all exams/questions.
- Student: register/login with Firebase, take exams within an admin-set countdown timer, get scored instantly (+1 correct / -0.25 wrong / 0 skipped), review correct vs wrong answers, see a per-exam leaderboard.


## 4. How the exam flow works

- Admin creates an exam with:
  - **Duration** — e.g. 30 minutes for 50 questions. This is the countdown each student sees once they click "Start Exam".
  - **Opens At / Closes At** — the availability window, e.g. a 24-hour window during which students may click Start whenever they like.
- Admin adds MCQ questions (question text + 4 options + which one is correct).
- Student clicks **Start Exam** (only possible inside the availability window) → server records `startedAt` and the countdown begins. Refreshing the page resumes the same countdown (computed server-side from `startedAt`, so it can't be reset by refreshing).
- When the timer hits 0 (or the student clicks Submit), answers are graded:
  - Correct answer → **+1**
  - Wrong answer → **−0.25**
  - Not answered → **0**
- Result page shows the score and highlights correct vs. the student's (wrong) answers per question.
- Leaderboard page ranks all submissions for an exam by score.

## 5. Tech stack
- Frontend: React 18, Vite, React Router v6, Tailwind CSS, Firebase Auth, Axios
- Backend: Express, MongoDB driver, firebase-admin (token verification)

**Live Website:** [Visit Website](https://exam-52810.web.app)