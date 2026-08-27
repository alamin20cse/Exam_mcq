import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';

function App() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                <Outlet />
            </main>
            <footer className="text-center text-sm text-gray-400 py-6">
                &copy; {new Date().getFullYear()} ExamHunter MCQ Platform
            </footer>
        </div>
    );
}

export default App;
