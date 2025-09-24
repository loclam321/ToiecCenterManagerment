import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import AuthPage from './pages/AuthPage';
import Teacher from './pages/teacher';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/teachers" element={<Teacher />} />
        {/* Thêm các route khác ở đây */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
