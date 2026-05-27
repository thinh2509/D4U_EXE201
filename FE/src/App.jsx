import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout.jsx';
import { ProtectedRoute, PublicRoute, roleHome } from './components/RouteGuards.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { LoginPage } from './pages/auth/LoginPage.jsx';
import { RegisterPage } from './pages/auth/RegisterPage.jsx';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.jsx';
import { AdminAuditLogsPage, AdminPortfolioPage, AdminUsersPage, AdminWithdrawalsPage } from './pages/admin/AdminShellPages.jsx';
import { VerificationDetailPage } from './pages/admin/VerificationDetailPage.jsx';
import { VerificationListPage } from './pages/admin/VerificationListPage.jsx';
import { ForbiddenPage } from './pages/shared/ForbiddenPage.jsx';
import { DashboardPage } from './pages/shared/MvpShellPage.jsx';
import { NotFoundPage } from './pages/shared/NotFoundPage.jsx';
import { ProjectExecutionPage, ProjectRatingPage, ProjectSubmissionsPage } from './pages/shared/ExecutionShellPages.jsx';
import { PaymentCancelPage, PaymentSuccessPage } from './pages/shared/PaymentResultPages.jsx';
import { SmeAiBriefPage, SmeAiMatchingPage, SmeApplicationsPage, SmeBillingPage, SmeOffersPage, SmeRatingsPage } from './pages/sme/SmeShellPages.jsx';
import { SmeProfilePage } from './pages/sme/SmeProfilePage.jsx';
import { SmeProjectApplicationsPage } from './pages/sme/SmeProjectApplicationsPage.jsx';
import { SmeProjectDetailPage } from './pages/sme/SmeProjectDetailPage.jsx';
import { SmeProjectFormPage } from './pages/sme/SmeProjectFormPage.jsx';
import { SmeProjectListPage } from './pages/sme/SmeProjectListPage.jsx';
import { StudentApplicationsPage, StudentMyProjectsPage, StudentOffersPage, StudentPortfolioPage, StudentRatingsPage, StudentWalletPage } from './pages/student/StudentShellPages.jsx';
import { StudentProfilePage } from './pages/student/StudentProfilePage.jsx';
import { StudentProjectDetailPage } from './pages/student/StudentProjectDetailPage.jsx';
import { StudentProjectListPage } from './pages/student/StudentProjectListPage.jsx';
import { StudentVerificationPage } from './pages/student/StudentVerificationPage.jsx';

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={roleHome(user?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmailPage /></PublicRoute>} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      <Route path="/forbidden" element={<ProtectedRoute><ForbiddenPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

      <Route element={<ProtectedRoute roles={['STUDENT']}><AppLayout /></ProtectedRoute>}>
        <Route path="/student/dashboard" element={<DashboardPage />} />
        <Route path="/student/profile" element={<StudentProfilePage />} />
        <Route path="/student/verification" element={<StudentVerificationPage />} />
        <Route path="/student/projects" element={<StudentProjectListPage />} />
        <Route path="/student/projects/:projectId" element={<StudentProjectDetailPage />} />
        <Route path="/student/applications" element={<StudentApplicationsPage />} />
        <Route path="/student/offers" element={<StudentOffersPage />} />
        <Route path="/student/my-projects" element={<StudentMyProjectsPage />} />
        <Route path="/student/portfolio" element={<StudentPortfolioPage />} />
        <Route path="/student/wallet" element={<StudentWalletPage />} />
        <Route path="/student/ratings" element={<StudentRatingsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['SME']}><AppLayout /></ProtectedRoute>}>
        <Route path="/sme/dashboard" element={<DashboardPage />} />
        <Route path="/sme/profile" element={<SmeProfilePage />} />
        <Route path="/sme/projects" element={<SmeProjectListPage />} />
        <Route path="/sme/projects/new" element={<SmeProjectFormPage mode="create" />} />
        <Route path="/sme/projects/:projectId" element={<SmeProjectDetailPage />} />
        <Route path="/sme/projects/:projectId/edit" element={<SmeProjectFormPage mode="edit" />} />
        <Route path="/sme/projects/:projectId/applications" element={<SmeProjectApplicationsPage />} />
        <Route path="/sme/applications" element={<SmeApplicationsPage />} />
        <Route path="/sme/offers" element={<SmeOffersPage />} />
        <Route path="/sme/ai-brief" element={<SmeAiBriefPage />} />
        <Route path="/sme/ai-matching" element={<SmeAiMatchingPage />} />
        <Route path="/sme/billing" element={<SmeBillingPage />} />
        <Route path="/sme/ratings" element={<SmeRatingsPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']}><AppLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/verifications" element={<VerificationListPage />} />
        <Route path="/admin/verifications/:verificationId" element={<VerificationDetailPage />} />
        <Route path="/admin/student-verifications" element={<Navigate to="/admin/verifications" replace />} />
        <Route path="/admin/student-verifications/:verificationId" element={<VerificationDetailPage />} />
        <Route path="/admin/portfolio" element={<AdminPortfolioPage />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/projects/:projectId/execution" element={<ProjectExecutionPage />} />
        <Route path="/projects/:projectId/submissions" element={<ProjectSubmissionsPage />} />
        <Route path="/projects/:projectId/rating" element={<ProjectRatingPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
