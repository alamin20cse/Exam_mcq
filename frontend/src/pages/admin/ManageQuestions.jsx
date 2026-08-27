import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import Loading from '../../components/Loading';

const ManageQuestions = () => {
    const { examId } = useParams();
    const axiosSecure = useAxiosSecure();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    const loadQuestions = () => {
        setLoading(true);
        axiosSecure.get(`/admin/exams/${examId}/questions`)
            .then((res) => setQuestions(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

    const handleDelete = (id) => {
        if (!window.confirm('Delete this question?')) return;
        axiosSecure.delete(`/admin/questions/${id}`).then(loadQuestions);
    };

    const handleUpdate = async (e, questionId) => {
        e.preventDefault();
        const form = e.target;
        const options = [form.opt0.value, form.opt1.value, form.opt2.value, form.opt3.value];
        const correctAnswerIndex = Number(form.correct.value);

        await axiosSecure.patch(`/admin/questions/${questionId}`, {
            questionText: form.questionText.value,
            options,
            correctAnswerIndex
        });
        setEditingId(null);
        loadQuestions();
    };

    if (loading) return <Loading />;

    return (
        <div>
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-bold">Questions ({questions.length})</h1>
                <Link to={`/admin/exams/${examId}/questions/add`} className="btn-primary">+ Add Question</Link>
            </div>

            {questions.length === 0 ? (
                <p className="text-gray-500">No questions added yet.</p>
            ) : (
                <div className="space-y-4">
                    {questions.map((q, idx) => (
                        <div key={q._id} className="card">
                            {editingId === q._id ? (
                                <form onSubmit={(e) => handleUpdate(e, q._id)} className="space-y-3">
                                    <textarea name="questionText" defaultValue={q.questionText} className="input" rows={2} required />
                                    {[0, 1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <input type="radio" name="correct" value={i} defaultChecked={q.correctAnswerIndex === i} required />
                                            <input name={`opt${i}`} defaultValue={q.options[i]} className="input" required />
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <button type="submit" className="btn-primary text-sm">Save</button>
                                        <button type="button" onClick={() => setEditingId(null)} className="btn-secondary text-sm">Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <p className="font-medium mb-2">{idx + 1}. {q.questionText}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                        {q.options.map((opt, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className={`px-2 py-1.5 rounded border ${
                                                    optIdx === q.correctAnswerIndex ? 'border-green-400 bg-green-50 font-medium' : 'border-gray-200'
                                                }`}
                                            >
                                                {opt} {optIdx === q.correctAnswerIndex && '✓'}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingId(q._id)} className="btn-secondary text-sm">Edit</button>
                                        <button onClick={() => handleDelete(q._id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-200">
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageQuestions;
