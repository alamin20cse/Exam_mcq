import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`;

const AdminDashboard = () => {
    return (
        <div className="grid md:grid-cols-[220px_1fr] gap-6">
            <aside className="space-y-1">
                <h2 className="font-semibold text-gray-500 text-xs uppercase mb-2 px-2">Admin Panel</h2>
                <NavLink to="/admin/exams" className={linkClass} end>Manage Exams</NavLink>
                <NavLink to="/admin/exams/create" className={linkClass}>Create Exam</NavLink>
            </aside>
            <section>
                <Outlet />
            </section>
        </div>
    );
};

export default AdminDashboard;
