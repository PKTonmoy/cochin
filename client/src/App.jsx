import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import StudentLayout from './layouts/StudentLayoutModern'

// Public pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import StudentLoginPage from './pages/public/StudentLoginPage'
import SuccessStoriesPage from './pages/public/SuccessStories'
import DynamicPage from './pages/public/DynamicPage'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import StudentList from './pages/admin/StudentList'
import AddStudent from './pages/admin/AddStudent'
import EditStudent from './pages/admin/EditStudent'
import PaymentList from './pages/admin/PaymentList'
import TestList from './pages/admin/TestList'
import AddTest from './pages/admin/AddTest'
import ResultList from './pages/admin/ResultList'
import UploadResults from './pages/admin/UploadResults'
import UploadBatches from './pages/admin/UploadBatches'
import ReceiptView from './pages/admin/ReceiptView'
import ReceiptList from './pages/admin/ReceiptList'
import AttendanceManagement from './pages/admin/AttendanceManagement'
import ClassList from './pages/admin/ClassList'
import AddClass from './pages/admin/AddClass'
import ScheduleCalendarPage from './pages/admin/ScheduleCalendar'
import CMSDashboard from './pages/admin/CMSDashboard'
import PageEditor from './pages/admin/PageEditor'

// Student pages
import StudentDashboard from './pages/student/DashboardV2'
import StudentResults from './pages/student/Results'
import StudentProfile from './pages/student/Profile'
import StudentSchedule from './pages/student/Schedule'

// Protected Route component
const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student-login" element={<StudentLoginPage />} />
        <Route path="/stories" element={<SuccessStoriesPage />} />
        <Route path="/page/:slug" element={<DynamicPage />} />
        <Route path="/preview/:slug" element={<DynamicPage />} />
      </Route>

      {/* Admin/Staff routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin', 'staff']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<StudentList />} />
        <Route path="students/add" element={<AddStudent />} />
        <Route path="students/:id/edit" element={<EditStudent />} />
        <Route path="payments" element={<PaymentList />} />
        <Route path="tests" element={<TestList />} />
        <Route path="tests/add" element={<AddTest />} />
        <Route path="results" element={<ResultList />} />
        <Route path="upload" element={<UploadResults />} />
        <Route path="attendance" element={<AttendanceManagement />} />
        <Route path="batches" element={<UploadBatches />} />
        <Route path="receipts" element={<ReceiptList />} />
        <Route path="receipts/:receiptId" element={<ReceiptView />} />
        {/* Class Management Routes */}
        <Route path="classes" element={<ClassList />} />
        <Route path="classes/add" element={<AddClass />} />
        <Route path="schedule-calendar" element={<ScheduleCalendarPage />} />
        {/* CMS Visual Editor Routes */}
        <Route path="cms" element={<CMSDashboard />} />
        <Route path="cms/pages/:slug" element={<PageEditor />} />
      </Route>

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="schedule" element={<StudentSchedule />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
