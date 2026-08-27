import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Login = () => {
    const { loginUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const form = e.target;
        const email = form.email.value;
        const password = form.password.value;

        loginUser(email, password)
            .then(() => navigate(from, { replace: true }))
            .catch((err) => setError(err.message.replace('Firebase: ', '')))
            .finally(() => setSubmitting(false));
    };

    return (
        <div className="max-w-md mx-auto card mt-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
            {error && <p className="bg-red-50 text-red-600 text-sm p-2 rounded mb-4">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input name="email" type="email" required className="input" placeholder="you@example.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input name="password" type="password" required className="input" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p className="text-sm text-center mt-4 text-gray-600">
                New here? <Link to="/register" className="text-primary font-medium">Create an account</Link>
            </p>
        </div>
    );
};

export default Login;
