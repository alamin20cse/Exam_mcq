import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAxiosSecure from '../hooks/useAxiosSecure';
import Loading from '../components/Loading';

const verdictStyle = {
    correct: 'border-green-300 bg-green-50',
    wrong: 'border-red-300 bg-red-50',
    unanswered: 'border-gray-200 bg-gray-50'
};

const ExamResult = () => {
    const { attemptId } = useParams();
    const axiosSecure = useAxiosSecure();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        axiosSecure.get(`/results/${attemptId}`)
            .then((res) => setResult(res.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load result'))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId]);

    if (loading) return <Loading />;
    if (error) return <p className="text-red-600 text-center mt-8">{error}</p>;
    if (!result) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="card text-center">
                <h1 className="text-xl font-bold mb-1">{result.examTitle}</h1>
                <p className="text-gray-500 text-sm mb-4">Submitted {new Date(result.submittedAt).toLocaleString()}</p>

                <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                        <p className="text-2xl font-bold text-primary">{result.score}</p>
                        <p className="text-gray-500">Score</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-600">{result.correctCount}</p>
                        <p className="text-gray-500">Correct</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-600">{result.wrongCount}</p>
                        <p className="text-gray-500">Wrong</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-500">{result.unansweredCount}</p>
                        <p className="text-gray-500">Skipped</p>
                    </div>
                </div>

                <Link to={`/leaderboard/${result.examId}`} className="btn-primary inline-block mt-5">
                    View Leaderboard
                </Link>
            </div>

            <div className="space-y-4">
                {result.details.map((d, idx) => (
                    <div key={d.questionId} className={`card border ${verdictStyle[d.verdict]}`}>
                        <p className="font-medium mb-3">{idx + 1}. {d.questionText}</p>
                        <div className="space-y-2">
                            {d.options.map((opt, optIdx) => {
                                const isCorrectOpt = optIdx === d.correctAnswerIndex;
                                const isSelectedOpt = optIdx === d.selected;
                                return (
                                    <div
                                        key={optIdx}
                                        className={`text-sm px-3 py-2 rounded-lg border flex items-center justify-between ${
                                            isCorrectOpt
                                                ? 'border-green-400 bg-green-100'
                                                : isSelectedOpt
                                                ? 'border-red-400 bg-red-100'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        <span>{opt}</span>
                                        {isCorrectOpt && <span className="text-green-700 text-xs font-semibold">✓ Correct</span>}
                                        {isSelectedOpt && !isCorrectOpt && <span className="text-red-700 text-xs font-semibold">✗ Your answer</span>}
                                    </div>
                                );
                            })}
                        </div>
                        {d.verdict === 'unanswered' && (
                            <p className="text-xs text-gray-500 mt-2">You did not answer this question.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExamResult;
