import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import Loading from '../../components/Loading';

const toLocalInputValue = (isoDate) => {
    const d = new Date(isoDate);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditExam = () => {
    const { examId } = useParams();
    const axiosSecure = useAxiosSecure();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        axiosSecure.get('/admin/exams')
            .then((res) => {
                const found = res.data.find((e) => e._id === examId);
                setExam(found);
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId]);

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
            await axiosSecure.patch(`/admin/exams/${examId}`, payload);
            navigate('/admin/exams');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update exam');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;
    if (!exam) return <p className="text-red-600">Exam not found</p>;

    return (
        <div className="max-w-xl">
            <h1 className="text-xl font-bold mb-5">Edit Exam</h1>
            {error && <p className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="card space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input name="title" defaultValue={exam.title} required className="input" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea name="description" defaultValue={exam.description} className="input" rows={3} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                    <input name="duration" type="number" min="1" defaultValue={exam.duration} required className="input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Opens At</label>
                        <input name="windowStart" type="datetime-local" defaultValue={toLocalInputValue(exam.windowStart)} required className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Closes At</label>
                        <input name="windowEnd" type="datetime-local" defaultValue={toLocalInputValue(exam.windowEnd)} required className="input" />
                    </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
};

export default EditExam;
