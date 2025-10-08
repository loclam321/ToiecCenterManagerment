import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/Admin/Dashboard';
import StudentManagement from './pages/Admin/StudentManagement';
import StudentDetail from './pages/Admin/StudentDetail';
import StudentForm from './pages/Admin/StudentForm';
import TeacherManagement from './pages/Admin/TeacherManagement';
import TeacherDetail from './pages/Admin/TeacherDetail';
import TeacherForm from './pages/Admin/TeacherForm';
import CourseManagement from './pages/Admin/CourseManagement';
import CourseDetail from './pages/Admin/CourseDetail';
import TeacherIntroduction from './pages/Teacher/TeacherIntroduction';
import CourseIntroduction from './pages/Courses/CourseIntroduction';
import AddClassForm from './pages/Admin/AddClassForm';
import ClassDetail from './pages/Admin/ClassDetail'; // Thêm import
import AddStudentToClass from './pages/Admin/AddStudentToClass';
import Schedule from './pages/Admin/Schedule';
import ProtectedRoute from './components/auth/ProtectedRoute';
import StudentPage from './pages/student/StudentPage';
import StudentDashboard from './pages/student/Dashboard';
import MyCourses from './pages/student/MyCourses';
import StudentSchedule from './pages/student/Schedule';
import StudentTests from './pages/student/Tests';
import StudentProfile from './pages/student/Profile';
import TestRunner from './pages/student/TestRunner';
import Logout from './pages/Logout';



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/teachers" element={<TeacherIntroduction />} />
  <Route path="/logout" element={<Logout />} />
        {/* Admin area (teachers may share admin UI). Restrict to teacher for now. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <StudentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <StudentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/add"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <StudentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/:id/edit"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <StudentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/add"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/:id/edit"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <TeacherForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <CourseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:courseId/add-class"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <AddClassForm />
            </ProtectedRoute>
          }
        />
        <Route path="/courses/:courseId" element={<CourseIntroduction />} />
        <Route
          path="/admin/classes/:id"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <ClassDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes/:id/add-students"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <AddStudentToClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <ProtectedRoute roles={["teacher", "admin"]}>
              <Schedule />
            </ProtectedRoute>
          }
        />

        {/* Student area */}
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={["student"]}>
              <StudentPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentDashboard />} />
          <Route path="courses" element={<MyCourses />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="tests" element={<StudentTests />} />
          <Route path="tests/:testId" element={<TestRunner />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
