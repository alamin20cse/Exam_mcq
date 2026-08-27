import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loading from '../components/Loading';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <Loading />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    return children;
};

export default PrivateRoute;
