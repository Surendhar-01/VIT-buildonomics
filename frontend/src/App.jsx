import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import ProfileEditorPage from './pages/ProfileEditorPage';
import PortfolioBuilderPage from './pages/PortfolioBuilderPage';
import PublicPortfolioPage from './pages/PublicPortfolioPage';
import ProjectManagerPage from './pages/ProjectManagerPage';
import AssessmentListPage from './pages/AssessmentListPage';
import AssessmentTakePage from './pages/AssessmentTakePage';
import AssessmentResultPage from './pages/AssessmentResultPage';
import CredentialWalletPage from './pages/CredentialWalletPage';
import PublicVerificationPage from './pages/PublicVerificationPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import ShortlistsPage from './pages/ShortlistsPage';
import IssuerDashboard from './pages/IssuerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminProblemsPage from './pages/AdminProblemsPage';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage';
import SkillGapPage from './pages/SkillGapPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout with Navbar and Sidebar
function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <div className="flex-1 flex w-full">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Landing & Auth */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Standalone Public Verification & Portfolio Pages */}
          <Route path="/p/:slug" element={<PublicPortfolioPage />} />
          <Route path="/portfolio/:slug" element={<PublicPortfolioPage />} />
          <Route path="/verify" element={<PublicVerificationPage />} />
          <Route path="/verify/:credentialId" element={<PublicVerificationPage />} />

          {/* Workspace Shell */}
          <Route element={<AppLayout />}>
            {/* Student Candidate Routes */}
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/profile" element={<ProfileEditorPage />} />
            <Route path="/portfolio-builder" element={<PortfolioBuilderPage />} />
            <Route path="/projects" element={<ProjectManagerPage />} />
            <Route path="/assessments" element={<AssessmentListPage />} />
            <Route path="/assessments/:id" element={<AssessmentTakePage />} />
            <Route path="/problems/:id" element={<AssessmentTakePage />} />
            <Route path="/assessments/result/:id" element={<AssessmentResultPage />} />
            <Route path="/wallet" element={<CredentialWalletPage />} />
            <Route path="/skill-gap" element={<SkillGapPage />} />

            {/* Recruiter Routes */}
            <Route path="/recruiter" element={<RecruiterDashboard />} />
            <Route path="/recruiter/shortlists" element={<ShortlistsPage />} />

            {/* Issuer Routes */}
            <Route path="/issuer" element={<IssuerDashboard />} />
            <Route path="/issuer/issue" element={<IssuerDashboard />} />
            <Route path="/issuer/templates" element={<IssuerDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/problems" element={<AdminProblemsPage />} />
            <Route path="/admin/audit" element={<AdminAuditLogsPage />} />

            {/* Account Settings */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
