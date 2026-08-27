import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';

const Leaderboard = () => {
    const { examId } = useParams();
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState(examId || '');
    const [board, setBoard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [boardLoading, setBoardLoading] = useState(false);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/exams`)
            .then((res) => {
                setExams(res.data);
                if (!selectedExamId && res.data.length > 0) {
                    setSelectedExamId(res.data[0]._id);
                }
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedExamId) return;
        setBoardLoading(true);
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/exams/${selectedExamId}/leaderboard`)
            .then((res) => setBoard(res.data))
            .catch(() => setBoard([]))
            .finally(() => setBoardLoading(false));
    }, [selectedExamId]);

    if (loading) return <Loading />;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <select
                    className="input max-w-xs"
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                >
                    {exams.map((exam) => (
                        <option key={exam._id} value={exam._id}>{exam.title}</option>
                    ))}
                </select>
            </div>

            {boardLoading ? (
                <Loading />
            ) : board.length === 0 ? (
                <p className="text-gray-500">No submissions yet for this exam.</p>
            ) : (
                <div className="card p-0 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left px-4 py-3">Rank</th>
                                <th className="text-left px-4 py-3">Name</th>
                                <th className="text-right px-4 py-3">Score</th>
                                <th className="text-right px-4 py-3">Correct</th>
                                <th className="text-right px-4 py-3">Wrong</th>
                            </tr>
                        </thead>
                        <tbody>
                            {board.map((row) => (
                                <tr key={row.userEmail} className="border-t border-gray-100">
                                    <td className="px-4 py-3 font-medium">
                                        {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                                    </td>
                                    <td className="px-4 py-3">{row.userName}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-primary">{row.score}</td>
                                    <td className="px-4 py-3 text-right text-green-600">{row.correctCount}</td>
                                    <td className="px-4 py-3 text-right text-red-600">{row.wrongCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
