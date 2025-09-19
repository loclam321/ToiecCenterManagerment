import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

function App() {


  return (
    <div className="app-layout bg-light min-vh-100 d-flex flex-column">
      {/* Header */}
      <header className="header bg-primary text-white py-3">
        <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between">
          <h1 className="h3 mb-2 mb-md-0">Hệ Thống Quản Lý Trung Tâm TOEIC</h1>
          <nav>
            <a className="btn btn-outline-light mx-1" href="/">Trang chủ</a>
            <a className="btn btn-outline-light mx-1" href="/students">Học viên</a>
            <a className="btn btn-outline-light mx-1" href="/teachers">Giáo viên</a>
            <a className="btn btn-outline-light mx-1" href="/courses">Khóa học</a>
            <a className="btn btn-outline-light mx-1" href="/exams">Kỳ thi</a>
          </nav>
        </div>
      </header>

      <div className="container flex-grow-1 d-flex">
        {/* Sidebar */}
        <aside className="sidebar bg-white border rounded p-3 me-4" style={{ minWidth: '220px', maxHeight: 'fit-content' }}>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <a className="nav-link active" href="/dashboard">Dashboard</a>
            </li>
            <li className="nav-item mb-2">
              <a className="nav-link" href="/students">Quản lý học viên</a>
            </li>
            <li className="nav-item mb-2">
              <a className="nav-link" href="/teachers">Quản lý giáo viên</a>
            </li>
            <li className="nav-item mb-2">
              <a className="nav-link" href="/courses">Quản lý khóa học</a>
            </li>
            <li className="nav-item mb-2">
              <a className="nav-link" href="/exams">Quản lý kỳ thi</a>
            </li>
            <li className="nav-item mb-2">
              <a className="nav-link" href="/reports">Báo cáo</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/settings">Cài đặt</a>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="content flex-grow-1 bg-white border rounded p-4">
          <h2 className="mb-3">Chào mừng đến với hệ thống quản lý trung tâm TOEIC</h2>
          <p>Chọn chức năng ở menu để bắt đầu quản lý.</p>
        </main>
      </div>

      {/* Footer */}
      <footer className="footer bg-primary text-white text-center py-3 mt-4">
        &copy; {new Date().getFullYear()} Trung tâm TOEIC. All rights reserved.
      </footer>
    </div>
  )
}

export default App
