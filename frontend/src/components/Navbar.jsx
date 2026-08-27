import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
    const { user, role, logoutUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser().then(() => navigate('/login'));
    };

    const linkClass = ({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`;

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
                <Link to="/" className="text-xl font-bold text-primary">GSTU job Hunter</Link>

                <div className="flex items-center gap-1">
                    <NavLink to="/" className={linkClass} end>Exams</NavLink>
                    {user && <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>}
                    {role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <span className="text-sm text-gray-600 hidden sm:inline">
                                {user.displayName || user.email}
                            </span>
                            <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-secondary text-sm">Login</Link>
                            <Link to="/register" className="btn-primary text-sm">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
