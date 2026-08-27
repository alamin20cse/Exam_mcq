import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import Loading from '../../components/Loading';

const ManageExams = () => {
    const axiosSecure = useAxiosSecure();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadExams = () => {
        setLoading(true);
        axiosSecure.get('/admin/exams')
            .then((res) => setExams(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadExams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = (id, title) => {
        if (!window.confirm(`Delete "${title}"? This also removes all its questions and attempts.`)) return;
        axiosSecure.delete(`/admin/exams/${id}`).then(loadExams);
    };

    if (loading) return <Loading />;

    return (
        <div>
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-bold">All Exams</h1>
                <Link to="/admin/exams/create" className="btn-primary">+ New Exam</Link>
            </div>

            {exams.length === 0 ? (
                <p className="text-gray-500">No exams created yet.</p>
            ) : (
                <div className="space-y-3">
                    {exams.map((exam) => (
                        <div key={exam._id} className="card flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="font-semibold">{exam.title}</h3>
                                <p className="text-xs text-gray-500">
                                    {exam.totalQuestions} questions · {exam.duration} min · Opens {new Date(exam.windowStart).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Link to={`/admin/exams/${exam._id}/questions`} className="btn-secondary text-sm">Questions</Link>
                                <Link to={`/admin/exams/${exam._id}/edit`} className="btn-secondary text-sm">Edit</Link>
                                <button onClick={() => handleDelete(exam._id, exam.title)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageExams;
