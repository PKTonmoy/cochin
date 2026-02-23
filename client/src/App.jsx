import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, Component } from 'react'
import { useAuth } from './contexts/AuthContext'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import StudentLayout from './layouts/StudentLayoutModern'
import DynamicMetadata from './components/DynamicMetadata'
import PWAInstallPrompt from './components/PWAInstallPrompt'

// Public pages
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import StudentLoginPage from './pages/public/StudentLoginPage'
import SuccessStoriesPage from './pages/public/SuccessStories'
import ProgramsPage from './pages/public/ProgramsPage'
import DynamicPage from './pages/public/DynamicPage'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import StudentList from './pages/admin/StudentList'
import StudentDetails from './pages/admin/StudentDetails'
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
import LeadManagement from './pages/admin/LeadManagement'
import AttendanceManagement from './pages/admin/AttendanceManagement'
import ClassList from './pages/admin/ClassList'
import AddClass from './pages/admin/AddClass'
import ScheduleCalendarPage from './pages/admin/ScheduleCalendar'
import CMSDashboard from './pages/admin/CMSDashboard'
import PageEditor from './pages/admin/PageEditor'
import AdminWorkflowDashboard from './pages/admin/AdminWorkflowDashboard'

// CMS Entity Management Pages
import FacultyList from './pages/admin/FacultyList'
import AddFaculty from './pages/admin/AddFaculty'
import CourseList from './pages/admin/CourseList'
import AddCourse from './pages/admin/AddCourse'
import TopperList from './pages/admin/TopperList'
import AddTopper from './pages/admin/AddTopper'
import TestimonialList from './pages/admin/TestimonialList'
import AddTestimonial from './pages/admin/AddTestimonial'
import MediaLibrary from './pages/admin/MediaLibrary'
import GlobalSettings from './pages/admin/GlobalSettings'
import SMSManagement from './pages/admin/SMSManagement'
import PWAQRSettings from './pages/admin/PWAQRSettings'
import NoticeManagement from './pages/admin/NoticeManagement'

// Smart redirect page (portal entry)
import PortalEntryPage from './pages/public/PortalEntryPage'

// Student pages
import StudentDashboard from './pages/student/DashboardV2'
import StudentResults from './pages/student/ResultsV2'
import StudentProfile from './pages/student/Profile'
import StudentSchedule from './pages/student/Schedule'
import StudentAttendanceHistory from './pages/student/AttendanceHistory'
import StudentNotices from './pages/student/Notices'

// Lazy load BuilderPage to isolate Builder.io initialization issues
const BuilderPage = lazy(() => import('./pages/public/BuilderPage'))

// Error Boundary for Builder.io pages
class BuilderErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Builder.io Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Load Error</h1>
            <p className="text-gray-600 mb-4">There was an issue loading this page.</p>
            <a href="/" className="btn btn-primary">Go to Homepage</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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
    const loginPath = roles?.includes('student') ? '/student-login' : '/login'
    return <Navigate to={loginPath} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <>
      <DynamicMetadata />
      <PWAInstallPrompt />
      <Routes>
        {/* Portal entry — smart redirect (no layout wrapper) */}
        <Route path="/portal-entry" element={<PortalEntryPage />} />

        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/student-login" element={<StudentLoginPage />} />
          <Route path="/stories" element={<SuccessStoriesPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/page/:slug" element={<DynamicPage />} />
          <Route path="/preview/:slug" element={<DynamicPage />} />
          {/* Builder.io Visual Editor Pages */}
          <Route path="/b/*" element={
            <BuilderErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="spinner"></div>
                </div>
              }>
                <BuilderPage />
              </Suspense>
            </BuilderErrorBoundary>
          } />
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
          <Route path="students/:id" element={<StudentDetails />} />
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
          <Route path="leads" element={<LeadManagement />} />
          {/* Class Management Routes */}
          <Route path="classes" element={<ClassList />} />
          <Route path="classes/add" element={<AddClass />} />
          <Route path="schedule-calendar" element={<ScheduleCalendarPage />} />
          {/* CMS Visual Editor Routes */}
          <Route path="cms" element={<CMSDashboard />} />
          <Route path="cms/pages/:slug" element={<PageEditor />} />
          {/* Workflow Dashboard */}
          <Route path="workflow" element={<AdminWorkflowDashboard />} />

          {/* CMS Entity Management Routes */}
          <Route path="faculty" element={<FacultyList />} />
          <Route path="faculty/add" element={<AddFaculty />} />
          <Route path="faculty/edit/:id" element={<AddFaculty />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/add" element={<AddCourse />} />
          <Route path="courses/edit/:id" element={<AddCourse />} />
          <Route path="toppers" element={<TopperList />} />
          <Route path="toppers/add" element={<AddTopper />} />
          <Route path="toppers/edit/:id" element={<AddTopper />} />
          <Route path="testimonials" element={<TestimonialList />} />
          <Route path="testimonials/add" element={<AddTestimonial />} />
          <Route path="testimonials/edit/:id" element={<AddTestimonial />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="settings" element={<GlobalSettings />} />
          <Route path="sms-management" element={<SMSManagement />} />
          <Route path="pwa-qr" element={<PWAQRSettings />} />
          <Route path="notice-management" element={<NoticeManagement />} />
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
          <Route path="attendance" element={<StudentAttendanceHistory />} />
          <Route path="notices" element={<StudentNotices />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
