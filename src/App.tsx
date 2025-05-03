import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import AddStudent from './pages/AddStudent';
import TakeAttendance from './pages/TakeAttendance';
import ViewAttendance from './pages/ViewAttendance';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import { ArrowLeft } from 'lucide-react';
import Button from './components/Button';
import Courses from './pages/Courses';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
        <Route path="/students/add" element={<ProtectedRoute><AddStudent /></ProtectedRoute>} />
        <Route path="/attendance/take" element={<ProtectedRoute><TakeAttendance /></ProtectedRoute>} />
        <Route path="/attendance/view" element={<ProtectedRoute><ViewAttendance /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
