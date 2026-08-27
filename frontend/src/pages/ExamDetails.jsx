import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import useAxiosSecure from '../hooks/useAxiosSecure';
import Loading from '../components/Loading';

const ExamDetails = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const axiosSecure = useAxiosSecure();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [starting, setStarting] = useState(false);
    const [myResult, setMyResult] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const examRes = await axiosSecure.get(`/exams/${examId}`);
                setExam(examRes.data);

                try {
                    const resultRes = await axiosSecure.get(`/exams/${examId}/my-result`);
                    setMyResult(resultRes.data);
                } catch {
                    setMyResult(null);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load exam');
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

    const handleStart = async () => {
        setStarting(true);
        setError('');
        try {
            const res = await axiosSecure.post(`/exams/${examId}/start`);
            if (res.data.status === 'already-submitted') {
                navigate(`/results/${res.data.attemptId}`);
            } else {
                navigate(`/exams/${examId}/take`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start exam');
        } finally {
            setStarting(false);
        }
    };

    if (loading) return <Loading />;
    if (!exam) return <p className="text-red-600">{error || 'Exam not found'}</p>;

    const now = new Date();
    const start = new Date(exam.windowStart);
    const end = new Date(exam.windowEnd);
    const notStarted = now < start;
    const closed = now > end;

    return (
        <div className="max-w-2xl mx-auto card">
            <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
            <p className="text-gray-600 mb-4">{exam.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
                <div><span className="font-medium">Questions:</span> {exam.totalQuestions}</div>
                <div><span className="font-medium">Duration:</span> {exam.duration} minutes</div>
                <div><span className="font-medium">Opens:</span> {start.toLocaleString()}</div>
                <div><span className="font-medium">Closes:</span> {end.toLocaleString()}</div>
            </div>

            {error && <p className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</p>}

            {myResult?.status === 'submitted' ? (
                <div className="space-y-3">
                    <p className="bg-green-50 text-green-700 text-sm p-3 rounded">
                        You've already submitted this exam. Score: <strong>{myResult.score}</strong>
                    </p>
                    <Link to={`/results/${myResult._id}`} className="btn-primary block text-center">
                        View Your Result
                    </Link>
                </div>
            ) : notStarted ? (
                <p className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded">
                    This exam opens on {start.toLocaleString()}.
                </p>
            ) : closed ? (
                <p className="bg-gray-100 text-gray-600 text-sm p-3 rounded">
                    This exam window has closed.
                </p>
            ) : (
                <button onClick={handleStart} disabled={starting} className="btn-primary w-full">
                    {starting ? 'Starting...' : 'Start Exam'}
                </button>
            )}

            <p className="text-xs text-gray-400 mt-4">
                Scoring: +1 for correct, -0.25 for wrong, 0 for skipped. Once started, the timer cannot be paused.
            </p>
        </div>
    );
};

export default ExamDetails;
