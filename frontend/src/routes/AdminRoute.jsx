import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/Loading';

const AdminRoute = ({ children }) => {
    const { user, role, loading } = useAuth();

    if (loading) return <Loading />;
    if (!user) return <Navigate to="/login" replace />;
    if (role !== 'admin') return <Navigate to="/" replace />;

    return children;
};

export default AdminRoute;
