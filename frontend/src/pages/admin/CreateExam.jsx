import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAxiosSecure from '../../hooks/useAxiosSecure';

const CreateExam = () => {
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const form = e.target;
        const payload = {
            title: form.title.value,
            description: form.description.value,
            duration: Number(form.duration.value),
            windowStart: form.windowStart.value,
            windowEnd: form.windowEnd.value
        };

        try {
            const res = await axiosSecure.post('/admin/exams', payload);
            navigate(`/admin/exams/${res.data.insertedId}/questions`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create exam');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl">
            <h1 className="text-xl font-bold mb-5">Create Exam</h1>
            {error && <p className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="card space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input name="title" required className="input" placeholder="e.g. HSC Physics Model Test 1" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea name="description" className="input" rows={3} placeholder="Optional details for students" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <input name="duration" type="number" min="1" required className="input" placeholder="e.g. 30 for 50 questions" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Opens At</label>
                        <input name="windowStart" type="datetime-local" required className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Closes At</label>
                        <input name="windowEnd" type="datetime-local" required className="input" />
                    </div>
                </div>
                <p className="text-xs text-gray-500">
                    Tip: set "Closes At" 24 hours after "Opens At" to give students a full day to start the exam.
                    Once a student clicks Start, the exam duration timer (above) begins counting down for them individually.
                </p>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Creating...' : 'Create Exam & Add Questions'}
                </button>
            </form>
        </div>
    );
};

export default CreateExam;
