import { createBrowserRouter } from 'react-router-dom';
import App from '../App.jsx';
import Home from '../pages/Home.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ExamDetails from '../pages/ExamDetails.jsx';
import TakeExam from '../pages/TakeExam.jsx';
import ExamResult from '../pages/ExamResult.jsx';
import Leaderboard from '../pages/Leaderboard.jsx';
import NotFound from '../pages/NotFound.jsx';

import PrivateRoute from './PrivateRoute.jsx';
import AdminRoute from './AdminRoute.jsx';

import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ManageExams from '../pages/admin/ManageExams.jsx';
import CreateExam from '../pages/admin/CreateExam.jsx';
import EditExam from '../pages/admin/EditExam.jsx';
import ManageQuestions from '../pages/admin/ManageQuestions.jsx';
import AddQuestion from '../pages/admin/AddQuestion.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        errorElement: <NotFound />,
        children: [
            { index: true, element: <Home /> },
            { path: 'login', element: <Login /> },
            { path: 'register', element: <Register /> },
            { path: 'exams/:examId', element: <PrivateRoute><ExamDetails /></PrivateRoute> },
            { path: 'exams/:examId/take', element: <PrivateRoute><TakeExam /></PrivateRoute> },
            { path: 'results/:attemptId', element: <PrivateRoute><ExamResult /></PrivateRoute> },
            { path: 'leaderboard', element: <PrivateRoute><Leaderboard /></PrivateRoute> },
            { path: 'leaderboard/:examId', element: <PrivateRoute><Leaderboard /></PrivateRoute> },

            {
                path: 'admin',
                element: <AdminRoute><AdminDashboard /></AdminRoute>,
                children: [
                    { index: true, element: <ManageExams /> },
                    { path: 'exams', element: <ManageExams /> },
                    { path: 'exams/create', element: <CreateExam /> },
                    { path: 'exams/:examId/edit', element: <EditExam /> },
                    { path: 'exams/:examId/questions', element: <ManageQuestions /> },
                    { path: 'exams/:examId/questions/add', element: <AddQuestion /> },
                ]
            }
        ]
    }
]);

export default router;
