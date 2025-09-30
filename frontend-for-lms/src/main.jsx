import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AuthPage from './pages/AuthPage';
import Teacher from './pages/teacher';
import AdminDashboard from './pages/Admin/Dashboard';
import StudentManagement from './pages/Admin/StudentManagement';
import StudentDetail from './pages/Admin/StudentDetail';
import StudentForm from './pages/Admin/StudentForm';
import TeacherManagement from './pages/Admin/TeacherManagement';
import TeacherDetail from './pages/Admin/TeacherDetail';
import TeacherForm from './pages/Admin/TeacherForm';
import CourseManagement from './pages/Admin/CourseManagement';
import CourseDetail from './pages/Admin/CourseDetail';
import Teacher from './pages/Teacher/teacher';
import CourseDetail from './pages/Courses/CourseDetail';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/teachers" element={<Teacher />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/students/:id" element={<StudentDetail />} />
        <Route path="/admin/students/add" element={<StudentForm />} />
        <Route path="/admin/students/:id/edit" element={<StudentForm />} />
        <Route path="/admin/teachers" element={<TeacherManagement />} />
        <Route path="/admin/teachers/:id" element={<TeacherDetail />} />
        <Route path="/admin/teachers/add" element={<TeacherForm />} />
        <Route path="/admin/teachers/:id/edit" element={<TeacherForm />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/courses/:id" element={<CourseDetail />} />

        <Route path="/courses/:courseId" element={<CourseDetail />} />
        {/* Thêm các route khác ở đây */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
