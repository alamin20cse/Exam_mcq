import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAxiosSecure from '../hooks/useAxiosSecure';
import Loading from '../components/Loading';

const formatTime = (totalSeconds) => {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
};

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const answersRef = useRef(answers);
    const submittedRef = useRef(false);
    answersRef.current = answers;

    const handleSubmit = useCallback(async (auto = false) => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        try {
            const res = await axiosSecure.post(`/exams/${examId}/submit`, {
                answers: answersRef.current
            });
            navigate(`/results/${res.data.attemptId}`, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit exam');
            submittedRef.current = false;
            setSubmitting(false);
            if (auto) {
                // retry once shortly after in case of transient network issue
                setTimeout(() => handleSubmit(true), 3000);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

    // initialize: start/resume attempt + fetch questions
    useEffect(() => {
        const init = async () => {
            try {
                const startRes = await axiosSecure.post(`/exams/${examId}/start`);

                if (startRes.data.status === 'already-submitted') {
                    navigate(`/results/${startRes.data.attemptId}`, { replace: true });
                    return;
                }

                setRemainingSeconds(startRes.data.remainingSeconds);

                const qRes = await axiosSecure.get(`/exams/${examId}/questions`);
                setQuestions(qRes.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load exam');
            } finally {
                setLoading(false);
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

    // countdown timer
    useEffect(() => {
        if (loading || error) return;
        if (remainingSeconds <= 0) {
            handleSubmit(true);
            return;
        }
        const timer = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, error]);

    // autosave progress every 10s
    useEffect(() => {
        if (loading || error) return;
        const autosave = setInterval(() => {
            axiosSecure.patch(`/exams/${examId}/progress`, { answers: answersRef.current }).catch(() => {});
        }, 10000);
        return () => clearInterval(autosave);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, error, examId]);

    // warn before leaving page
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    const selectAnswer = (questionId, optionIndex) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    };

    if (loading) return <Loading />;
    if (error) return <p className="text-red-600 text-center mt-8">{error}</p>;

    const answeredCount = Object.keys(answers).length;
    const isLowTime = remainingSeconds <= 60;

    return (
        <div className="max-w-3xl mx-auto pb-24">
            <div className={`sticky top-16 z-30 mb-6 card flex items-center justify-between ${isLowTime ? 'border-red-300 bg-red-50' : ''}`}>
                <div>
                    <p className="text-sm text-gray-500">Answered</p>
                    <p className="font-semibold">{answeredCount} / {questions.length}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-gray-500">Time Remaining</p>
                    <p className={`text-2xl font-mono font-bold ${isLowTime ? 'text-red-600' : 'text-primary'}`}>
                        {formatTime(remainingSeconds)}
                    </p>
                </div>
                <button
                    onClick={() => {
                        if (window.confirm('Submit your exam now? You cannot change answers after this.')) {
                            handleSubmit(false);
                        }
                    }}
                    disabled={submitting}
                    className="btn-primary"
                >
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>

            <div className="space-y-5">
                {questions.map((q, idx) => (
                    <div key={q._id} className="card">
                        <p className="font-medium mb-3">
                            {idx + 1}. {q.questionText}
                        </p>
                        <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                                <label
                                    key={optIdx}
                                    className={`flex items-center gap-3 border rounded-lg px-3 py-2 cursor-pointer transition ${
                                        answers[q._id] === optIdx
                                            ? 'border-primary bg-indigo-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={q._id}
                                        checked={answers[q._id] === optIdx}
                                        onChange={() => selectAnswer(q._id, optIdx)}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TakeExam;
