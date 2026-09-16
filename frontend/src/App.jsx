import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import About from './pages/About';
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const AssessmentAttemptPage = lazy(() => import('./pages/AssessmentAttemptPage'));
import Dashboard from './pages/Dashboard';
import DashboardMetricPage from './pages/DashboardMetricPage';
import ConceptRoot from './pages/ConceptRoot';
import MistakeMap from './pages/MistakeMap';
import SkillGap from './pages/SkillGap';
import Roadmap from './pages/Roadmap';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import OnboardingPage from './pages/OnboardingPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Faq from './pages/Faq';
import PersonalIntelligence from './pages/PersonalIntelligence';

// Student Auth Guard
import StudentAuthGuard from './components/StudentAuthGuard';

// Admin Auth & Protection
import { AdminAuthProvider } from './context/AdminAuthContext';
import { StudentAuthProvider } from './context/StudentAuthContext';
import ProtectedRoute from './components/admin/ProtectedRoute';

// Admin Auth Pages
import AdminLogin from './pages/admin/AdminLogin';

// Admin Dashboard
import AdminLayout from './components/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import UserManagement from './pages/admin/UserManagement';
import AiAnalytics from './pages/admin/AiAnalytics';
import ContentManagement from './pages/admin/ContentManagement';
import ReportsPage from './pages/admin/ReportsPage';
import AdminSettings from './pages/admin/AdminSettings';
import AssessmentManagement from './pages/admin/AssessmentManagement';

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function AssessmentLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FBF8F0]">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#1B332C]/10 mb-4">
          <div className="h-6 w-6 border-2 border-[#1B332C] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-[var(--color-text-muted)] font-medium">Loading assessments...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AdminAuthProvider>
      <StudentAuthProvider>
      <Router>
        <Routes>

          {/* =====================================================
              ADMIN AUTH ROUTES
              ===================================================== */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* =====================================================
              PROTECTED ADMIN DASHBOARD
              ===================================================== */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="dashboard" element={<AdminOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="assessments" element={<AssessmentManagement />} />
              <Route path="analytics" element={<AiAnalytics />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* =====================================================
              PUBLIC & STUDENT ROUTES
              ===================================================== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Onboarding Guard: Unauthenticated -> Login; Already Completed -> Dashboard */}
            <Route
              path="/onboardingpage"
              element={
                <StudentAuthGuard allowOnlyIncomplete>
                  <OnboardingPage />
                </StudentAuthGuard>
              }
            />

            {/* Protected Student Routes (Require Completed Onboarding) */}
            <Route
              path="/dashboard"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <Dashboard />
                </StudentAuthGuard>
              }
            />

            <Route
              path="/dashboard/:metric"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <DashboardMetricPage />
                </StudentAuthGuard>
              }
            />

            <Route
              path="/personal-intelligence"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <PersonalIntelligence />
                </StudentAuthGuard>
              }
            />

            <Route
              path="/assessment"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <Suspense fallback={<AssessmentLoading />}>
                    <AssessmentPage />
                  </Suspense>
                </StudentAuthGuard>
              }
            />

            <Route
              path="/assessment/:id"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <Suspense fallback={<AssessmentLoading />}>
                    <AssessmentAttemptPage />
                  </Suspense>
                </StudentAuthGuard>
              }
            />

            <Route
              path="/concept-root"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <ConceptRoot />
                </StudentAuthGuard>
              }
            />
            <Route
              path="/conceptroot"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <ConceptRoot />
                </StudentAuthGuard>
              }
            />

            <Route
              path="/mistake-map"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <MistakeMap />
                </StudentAuthGuard>
              }
            />

            <Route
              path="/skill-gap"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <SkillGap />
                </StudentAuthGuard>
              }
            />

            <Route
              path="/roadmap"
              element={
                <StudentAuthGuard requireOnboardingCompleted>
                  <Roadmap />
                </StudentAuthGuard>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
      </StudentAuthProvider>
    </AdminAuthProvider>
  );
}

export default App;
