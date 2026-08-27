import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loading from '../components/Loading';

const getExamState = (exam) => {
    const now = new Date();
    const start = new Date(exam.windowStart);
    const end = new Date(exam.windowEnd);
    if (now < start) return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-700' };
    if (now > end) return { label: 'Ended', color: 'bg-gray-200 text-gray-600' };
    return { label: 'Live', color: 'bg-green-100 text-green-700' };
};

const Home = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/exams`)
            .then((res) => setExams(res.data))
            .catch(() => setExams([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Available Exams</h1>

            {exams.length === 0 && (
                <p className="text-gray-500">No exams have been published yet. Check back soon!</p>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exams.map((exam) => {
                    const state = getExamState(exam);
                    return (
                        <div key={exam._id} className="card flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="font-semibold text-lg">{exam.title}</h2>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${state.color}`}>
                                        {state.label}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{exam.description}</p>
                                <div className="text-sm text-gray-500 space-y-1 mb-4">
                                    <p>📝 {exam.totalQuestions} Questions</p>
                                    <p>⏱ {exam.duration} minutes</p>
                                    <p>📅 Opens: {new Date(exam.windowStart).toLocaleString()}</p>
                                    <p>🔒 Closes: {new Date(exam.windowEnd).toLocaleString()}</p>
                                </div>
                            </div>
                            <Link to={`/exams/${exam._id}`} className="btn-primary text-center">
                                View Details
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Home;
