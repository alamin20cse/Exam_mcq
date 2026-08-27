import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import axios from 'axios';

const Register = () => {
    const { registerUser, updateUserProfile } = useAuth();
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const form = e.target;
        const name = form.name.value;
        const email = form.email.value;
        const password = form.password.value;

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setSubmitting(false);
            return;
        }

        try {
            const result = await registerUser(email, password);
            await updateUserProfile(name);

            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users`, {
                name,
                email,
                uid: result.user.uid
            });

            navigate('/');
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto card mt-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Create an account</h2>
            {error && <p className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</p>}
            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input name="name" type="text" required className="input" placeholder="Your name" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="email" type="email" required className="input" placeholder="you@example.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input name="password" type="password" required className="input" placeholder="At least 6 characters" />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Creating account...' : 'Register'}
                </button>
            </form>
            <p className="text-sm text-center mt-4 text-gray-600">
                Already have an account? <Link to="/login" className="text-primary font-medium">Login</Link>
            </p>
        </div>
    );
};

export default Register;
