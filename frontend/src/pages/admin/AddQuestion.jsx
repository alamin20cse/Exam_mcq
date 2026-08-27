import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAxiosSecure from '../../hooks/useAxiosSecure';

const AddQuestion = () => {
    const { examId } = useParams();
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [addAnother, setAddAnother] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const form = e.target;
        const payload = {
            questionText: form.questionText.value,
            options: [form.opt0.value, form.opt1.value, form.opt2.value, form.opt3.value],
            correctAnswerIndex: Number(form.correct.value)
        };

        try {
            await axiosSecure.post(`/admin/exams/${examId}/questions`, payload);
            if (addAnother) {
                form.reset();
            } else {
                navigate(`/admin/exams/${examId}/questions`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add question');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl">
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-bold">Add Question</h1>
                <Link to={`/admin/exams/${examId}/questions`} className="btn-secondary text-sm">Done, view all</Link>
            </div>

            {error && <p className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="card space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Question</label>
                    <textarea name="questionText" required className="input" rows={2} placeholder="Type the question here" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Options (select the correct one)</label>
                    <div className="space-y-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input type="radio" name="correct" value={i} required className="accent-primary" />
                                <input name={`opt${i}`} required className="input" placeholder={`Option ${i + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={addAnother} onChange={(e) => setAddAnother(e.target.checked)} />
                    Keep adding more questions after saving
                </label>

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Saving...' : 'Save Question'}
                </button>
            </form>
        </div>
    );
};

export default AddQuestion;
