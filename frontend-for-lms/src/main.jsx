import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AddClassForm from './pages/Admin/AddClassForm';
import AddStudentToClass from './pages/Admin/AddStudentToClass';
import StudentManagement from './pages/Admin/StudentManagement';
import StudentDetail from './pages/Admin/StudentDetail';
import StudentForm from './pages/Admin/StudentForm';
import TeacherManagement from './pages/Admin/TeacherManagement';
import TeacherDetail from './pages/Admin/TeacherDetail';
import TeacherForm from './pages/Admin/TeacherForm';
import CourseManagement from './pages/Admin/CourseManagement';
import CourseDetail from './pages/Admin/CourseDetail';
import ClassDetail from './pages/Admin/ClassDetail';
import CourseIntroduction from './pages/Courses/CourseIntroduction';
import TeacherIntroduction from './pages/Teacher/TeacherIntroduction';
import AdminDashboard from './pages/Admin/Dashboard';
import AuthPage from './pages/AuthPage';
import TeacherIntroduction from './pages/Teacher/TeacherIntroduction';  
import CourseIntroduction from './pages/Courses/CourseIntroduction';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/*" element={<App />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/teachers" element={<TeacherIntroduction />} />
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
  
        <Route path="/courses/:courseId" element={<CourseIntroduction />} />
        {/* Thêm các route khác ở đây */}
      </Routes>

    </BrowserRouter>
  </React.StrictMode>
)