const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require('./firebaseAdmin');

const app = express();
const port = process.env.PORT || 5000;

// ======================================================
// MONGODB
// ======================================================

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uslpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

// ======================================================
// MIDDLEWARE
// ======================================================

const corsOption = {
    origin: [process.env.CLIENT_URL || 'http://localhost:5174',  'https://exam-52810.web.app'],

    credentials: true
};

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

// ======================================================
// DATABASE COLLECTIONS
// ======================================================

const database = client.db('examMcq');

const usersCollection = database.collection('users');
const examsCollection = database.collection('exams');
const questionsCollection = database.collection('questions');
const resultsCollection = database.collection('results'); // also stores in-progress attempts

// ======================================================
// HELPER FUNCTIONS
// ======================================================

const isValidObjectId = (id) => ObjectId.isValid(id);

const gradeAttempt = (questions, answers) => {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let score = 0;

    const details = questions.map((q) => {
        const qId = q._id.toString();
        const hasAnswer = Object.prototype.hasOwnProperty.call(answers || {}, qId);
        const selected = hasAnswer ? answers[qId] : null;

        let verdict = 'unanswered';
        if (hasAnswer && selected !== null && selected !== undefined) {
            if (Number(selected) === Number(q.correctAnswerIndex)) {
                verdict = 'correct';
                correctCount += 1;
                score += 1;
            } else {
                verdict = 'wrong';
                wrongCount += 1;
                score -= 0.25;
            }
        } else {
            unansweredCount += 1;
        }

        return {
            questionId: qId,
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            selected: selected === undefined ? null : selected,
            verdict
        };
    });

    return {
        score: Math.round(score * 100) / 100,
        correctCount,
        wrongCount,
        unansweredCount,
        totalQuestions: questions.length,
        details
    };
};

// ======================================================
// AUTH MIDDLEWARES
// ======================================================

const verifyFBToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decoded = decoded; // { email, uid, ... }
        next();
    } catch (err) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
};

const verifyAdmin = async (req, res, next) => {
    const email = req.decoded?.email;
    if (!email) return res.status(401).send({ message: 'unauthorized access' });
    const user = await usersCollection.findOne({ email });
    if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'forbidden access: admin only' });
    }
    next();
};

// ======================================================
// HOME ROUTE
// ======================================================

app.get('/', (req, res) => {
    res.send('MCQ Exam Server is running');
});

// ======================================================
// USER ROUTES
// ======================================================

// Create/save user on register or first Google login
app.post('/users', async (req, res) => {
    try {
        const userInfo = req.body; // { name, email, uid, photoURL }
        if (!userInfo?.email) return res.status(400).send({ message: 'email is required' });

        const existing = await usersCollection.findOne({ email: userInfo.email });
        if (existing) {
            return res.send({ message: 'user already exists', inserted: false, user: existing });
        }

        const newUser = {
            name: userInfo.name || 'Anonymous',
            email: userInfo.email,
            uid: userInfo.uid,
            photoURL: userInfo.photoURL || null,
            role: 'user',
            createdAt: new Date()
        };
        const result = await usersCollection.insertOne(newUser);
        res.send({ message: 'user created', inserted: true, insertedId: result.insertedId });
    } catch (err) {
        res.status(500).send({ message: 'failed to save user', error: err.message });
    }
});

// Get logged-in user's own profile (also returns role)
app.get('/users/me', verifyFBToken, async (req, res) => {
    try {
        const email = req.decoded.email;
        const user = await usersCollection.findOne({ email });
        if (!user) return res.status(404).send({ message: 'user not found' });
        res.send(user);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch user', error: err.message });
    }
});

// Get role by email (used by frontend to guard admin routes)
app.get('/users/role/:email', verifyFBToken, async (req, res) => {
    try {
        if (req.params.email !== req.decoded.email) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        const user = await usersCollection.findOne({ email: req.params.email });
        res.send({ role: user?.role || 'user' });
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch role', error: err.message });
    }
});

// ======================================================
// PUBLIC EXAM ROUTES (student facing)
// ======================================================

// list all exams (basic info only, no answers)
app.get('/exams', async (req, res) => {
    try {
        const exams = await examsCollection
            .find({}, { projection: { title: 1, description: 1, duration: 1, totalQuestions: 1, windowStart: 1, windowEnd: 1 } })
            .sort({ windowStart: -1 })
            .toArray();
        res.send(exams);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch exams', error: err.message });
    }
});

// single exam basic info
app.get('/exams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid exam id' });

        const exam = await examsCollection.findOne(
            { _id: new ObjectId(id) },
            { projection: { title: 1, description: 1, duration: 1, totalQuestions: 1, windowStart: 1, windowEnd: 1 } }
        );
        if (!exam) return res.status(404).send({ message: 'exam not found' });
        res.send(exam);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch exam', error: err.message });
    }
});

// start (or resume) an exam attempt
app.post('/exams/:id/start', verifyFBToken, async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.decoded.email;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid exam id' });

        const exam = await examsCollection.findOne({ _id: new ObjectId(id) });
        if (!exam) return res.status(404).send({ message: 'exam not found' });

        const now = new Date();
        if (now < new Date(exam.windowStart)) {
            return res.status(400).send({ message: 'this exam has not started yet' });
        }
        if (now > new Date(exam.windowEnd)) {
            return res.status(400).send({ message: 'this exam window has closed' });
        }

        let attempt = await resultsCollection.findOne({ examId: id, userEmail: email });

        if (attempt && attempt.status === 'submitted') {
            return res.send({ status: 'already-submitted', attemptId: attempt._id });
        }

        if (attempt && attempt.status === 'in-progress') {
            const elapsedSec = Math.floor((now - new Date(attempt.startedAt)) / 1000);
            const remainingSec = exam.duration * 60 - elapsedSec;

            if (remainingSec <= 0) {
                // time already up from a previous session -> auto finalize with whatever was saved
                const questions = await questionsCollection.find({ examId: id }).toArray();
                const graded = gradeAttempt(questions, attempt.answers || {});
                await resultsCollection.updateOne(
                    { _id: attempt._id },
                    { $set: { status: 'submitted', submittedAt: now, ...graded } }
                );
                return res.send({ status: 'already-submitted', attemptId: attempt._id, autoSubmitted: true });
            }

            return res.send({
                status: 'in-progress',
                attemptId: attempt._id,
                remainingSeconds: remainingSec,
                duration: exam.duration
            });
        }

        const newAttempt = {
            examId: id,
            examTitle: exam.title,
            userEmail: email,
            userName: req.decoded.name || email,
            startedAt: now,
            duration: exam.duration,
            status: 'in-progress',
            answers: {}
        };
        const result = await resultsCollection.insertOne(newAttempt);

        res.send({
            status: 'in-progress',
            attemptId: result.insertedId,
            remainingSeconds: exam.duration * 60,
            duration: exam.duration
        });
    } catch (err) {
        res.status(500).send({ message: 'failed to start exam', error: err.message });
    }
});

// get exam questions (only while attempt is in-progress)
app.get('/exams/:id/questions', verifyFBToken, async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.decoded.email;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid exam id' });

        const attempt = await resultsCollection.findOne({ examId: id, userEmail: email });
        if (!attempt || attempt.status !== 'in-progress') {
            return res.status(403).send({ message: 'no active attempt for this exam' });
        }

        const questions = await questionsCollection
            .find({ examId: id }, { projection: { correctAnswerIndex: 0 } })
            .toArray();

        res.send(questions);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch questions', error: err.message });
    }
});

// save progress (optional autosave while taking exam - does not grade)
app.patch('/exams/:id/progress', verifyFBToken, async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.decoded.email;
        const { answers } = req.body; // { questionId: selectedIndex }

        const attempt = await resultsCollection.findOne({ examId: id, userEmail: email });
        if (!attempt || attempt.status !== 'in-progress') {
            return res.status(403).send({ message: 'no active attempt for this exam' });
        }

        await resultsCollection.updateOne(
            { _id: attempt._id },
            { $set: { answers: answers || {} } }
        );
        res.send({ message: 'progress saved' });
    } catch (err) {
        res.status(500).send({ message: 'failed to save progress', error: err.message });
    }
});

// submit exam -> grades and finalizes
app.post('/exams/:id/submit', verifyFBToken, async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.decoded.email;
        const { answers } = req.body;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid exam id' });

        const attempt = await resultsCollection.findOne({ examId: id, userEmail: email });
        if (!attempt) return res.status(404).send({ message: 'no attempt found, start the exam first' });
        if (attempt.status === 'submitted') {
            return res.send({ message: 'already submitted', attemptId: attempt._id });
        }

        const questions = await questionsCollection.find({ examId: id }).toArray();
        const graded = gradeAttempt(questions, answers || attempt.answers || {});

        await resultsCollection.updateOne(
            { _id: attempt._id },
            { $set: { status: 'submitted', submittedAt: new Date(), answers: answers || attempt.answers || {}, ...graded } }
        );

        res.send({ message: 'exam submitted', attemptId: attempt._id, ...graded });
    } catch (err) {
        res.status(500).send({ message: 'failed to submit exam', error: err.message });
    }
});

// get a single attempt/result detail (with correct answers, review view)
app.get('/results/:attemptId', verifyFBToken, async (req, res) => {
    try {
        const { attemptId } = req.params;
        const email = req.decoded.email;
        if (!isValidObjectId(attemptId)) return res.status(400).send({ message: 'invalid attempt id' });

        const attempt = await resultsCollection.findOne({ _id: new ObjectId(attemptId) });
        if (!attempt) return res.status(404).send({ message: 'result not found' });
        if (attempt.userEmail !== email) return res.status(403).send({ message: 'forbidden access' });

        res.send(attempt);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch result', error: err.message });
    }
});

// get my result for a specific exam (used to redirect if already submitted)
app.get('/exams/:id/my-result', verifyFBToken, async (req, res) => {
    try {
        const { id } = req.params;
        const email = req.decoded.email;
        const attempt = await resultsCollection.findOne({ examId: id, userEmail: email });
        if (!attempt) return res.status(404).send({ message: 'no attempt yet' });
        res.send(attempt);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch result', error: err.message });
    }
});

// leaderboard for a specific exam
app.get('/exams/:id/leaderboard', async (req, res) => {
    try {
        const { id } = req.params;
        const attempts = await resultsCollection
            .find({ examId: id, status: 'submitted' })
            .sort({ score: -1, submittedAt: 1 })
            .project({ userName: 1, userEmail: 1, score: 1, correctCount: 1, wrongCount: 1, unansweredCount: 1, submittedAt: 1 })
            .toArray();

        const leaderboard = attempts.map((a, index) => ({
            rank: index + 1,
            userName: a.userName,
            userEmail: a.userEmail,
            score: a.score,
            correctCount: a.correctCount,
            wrongCount: a.wrongCount,
            unansweredCount: a.unansweredCount
        }));

        res.send(leaderboard);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch leaderboard', error: err.message });
    }
});

// ======================================================
// ADMIN ROUTES
// ======================================================

// create exam
app.post('/admin/exams', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { title, description, duration, windowStart, windowEnd } = req.body;
        if (!title || !duration || !windowStart || !windowEnd) {
            return res.status(400).send({ message: 'title, duration, windowStart and windowEnd are required' });
        }

        const newExam = {
            title,
            description: description || '',
            duration: Number(duration), // minutes, e.g. 30 for 50 questions
            totalQuestions: 0,
            windowStart: new Date(windowStart), // e.g. availability opens
            windowEnd: new Date(windowEnd),     // e.g. availability closes (24 hrs later)
            createdBy: req.decoded.email,
            createdAt: new Date()
        };
        const result = await examsCollection.insertOne(newExam);
        res.send({ message: 'exam created', insertedId: result.insertedId });
    } catch (err) {
        res.status(500).send({ message: 'failed to create exam', error: err.message });
    }
});

// list all exams for admin (with question counts)
app.get('/admin/exams', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const exams = await examsCollection.find({}).sort({ createdAt: -1 }).toArray();
        res.send(exams);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch exams', error: err.message });
    }
});

// update exam
app.patch('/admin/exams/:id', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid exam id' });

        const { title, description, duration, windowStart, windowEnd } = req.body;
        const updateDoc = {};
        if (title !== undefined) updateDoc.title = title;
        if (description !== undefined) updateDoc.description = description;
        if (duration !== undefined) updateDoc.duration = Number(duration);
        if (windowStart !== undefined) updateDoc.windowStart = new Date(windowStart);
        if (windowEnd !== undefined) updateDoc.windowEnd = new Date(windowEnd);

        await examsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
        res.send({ message: 'exam updated' });
    } catch (err) {
        res.status(500).send({ message: 'failed to update exam', error: err.message });
    }
});

// delete exam (cascades to its questions and attempts)
app.delete('/admin/exams/:id', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid exam id' });

        await examsCollection.deleteOne({ _id: new ObjectId(id) });
        await questionsCollection.deleteMany({ examId: id });
        await resultsCollection.deleteMany({ examId: id });

        res.send({ message: 'exam and related data deleted' });
    } catch (err) {
        res.status(500).send({ message: 'failed to delete exam', error: err.message });
    }
});

// add question to an exam
app.post('/admin/exams/:id/questions', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid exam id' });

        const { questionText, options, correctAnswerIndex } = req.body;
        if (!questionText || !Array.isArray(options) || options.length !== 4) {
            return res.status(400).send({ message: 'questionText and exactly 4 options are required' });
        }
        if (correctAnswerIndex === undefined || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
            return res.status(400).send({ message: 'correctAnswerIndex must be between 0 and 3' });
        }

        const exam = await examsCollection.findOne({ _id: new ObjectId(id) });
        if (!exam) return res.status(404).send({ message: 'exam not found' });

        const newQuestion = {
            examId: id,
            questionText,
            options,
            correctAnswerIndex: Number(correctAnswerIndex),
            createdAt: new Date()
        };
        const result = await questionsCollection.insertOne(newQuestion);

        const count = await questionsCollection.countDocuments({ examId: id });
        await examsCollection.updateOne({ _id: new ObjectId(id) }, { $set: { totalQuestions: count } });

        res.send({ message: 'question added', insertedId: result.insertedId });
    } catch (err) {
        res.status(500).send({ message: 'failed to add question', error: err.message });
    }
});

// list questions of an exam (admin view, includes correct answers)
app.get('/admin/exams/:id/questions', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const questions = await questionsCollection.find({ examId: id }).sort({ createdAt: 1 }).toArray();
        res.send(questions);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch questions', error: err.message });
    }
});

// update a question
app.patch('/admin/questions/:id', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid question id' });

        const { questionText, options, correctAnswerIndex } = req.body;
        const updateDoc = {};
        if (questionText !== undefined) updateDoc.questionText = questionText;
        if (options !== undefined) updateDoc.options = options;
        if (correctAnswerIndex !== undefined) updateDoc.correctAnswerIndex = Number(correctAnswerIndex);

        await questionsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
        res.send({ message: 'question updated' });
    } catch (err) {
        res.status(500).send({ message: 'failed to update question', error: err.message });
    }
});

// delete a question
app.delete('/admin/questions/:id', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).send({ message: 'invalid question id' });

        const question = await questionsCollection.findOne({ _id: new ObjectId(id) });
        if (!question) return res.status(404).send({ message: 'question not found' });

        await questionsCollection.deleteOne({ _id: new ObjectId(id) });

        const count = await questionsCollection.countDocuments({ examId: question.examId });
        await examsCollection.updateOne({ _id: new ObjectId(question.examId) }, { $set: { totalQuestions: count } });

        res.send({ message: 'question deleted' });
    } catch (err) {
        res.status(500).send({ message: 'failed to delete question', error: err.message });
    }
});

// promote/demote a user's role (admin only utility)
app.patch('/admin/users/:email/role', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const { email } = req.params;
        const { role } = req.body; // 'admin' | 'user'
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).send({ message: 'role must be admin or user' });
        }
        await usersCollection.updateOne({ email }, { $set: { role } });
        res.send({ message: `role updated to ${role}` });
    } catch (err) {
        res.status(500).send({ message: 'failed to update role', error: err.message });
    }
});

app.get('/admin/users', verifyFBToken, verifyAdmin, async (req, res) => {
    try {
        const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
        res.send(users);
    } catch (err) {
        res.status(500).send({ message: 'failed to fetch users', error: err.message });
    }
});

// ======================================================
// START SERVER
// ======================================================

async function run() {
    try {
        // await client.connect();
        // await client.db('admin').command({ ping: 1 });
        console.log('Connected to MongoDB successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
    }
}
run();

app.listen(port, () => {
    console.log(`MCQ Exam Server is running on port ${port}`);
});
