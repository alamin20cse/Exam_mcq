import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

const NotFound = () => {
    const error = useRouteError();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <p className="text-gray-600 mb-6">
                {error?.statusText || error?.message || "Oops! The page you're looking for doesn't exist."}
            </p>
            <Link to="/" className="btn-primary">Go Home</Link>
        </div>
    );
};

export default NotFound;
