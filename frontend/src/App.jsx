import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ForgotPassword from './components/auth/ForgotPassword'
import ResetPassword from './components/auth/ResetPassword'
import ActivateAccount from './components/auth/ActivateAccount'
import ActivityTypesAdmin from './pages/ActivityTypesAdmin'
import ActivitiesAdmin from './pages/ActivitiesAdmin'
import ActivitiesCatalog from './pages/ActivitiesCatalog'
import ActivityDetail from './pages/ActivityDetail'
import MyRegistrations from './pages/MyRegistrations'
import RegistrationsAdmin from './pages/RegistrationsAdmin'
import QrScannerAdmin from './pages/QrScannerAdmin'
import TicketSubmit from './pages/TicketSubmit'
import MyTickets from './pages/MyTickets'
import TicketsAdmin from './pages/TicketsAdmin'
import DashboardAdmin from './pages/DashboardAdmin'
import ReportsAdmin from './pages/ReportsAdmin'
import AuditLogsAdmin from './pages/AuditLogsAdmin'
import Profile from './pages/Profile'
import NotificationBell from './components/ui/NotificationBell'
import Layout from './components/layout/Layout'
import { authStore } from './stores/authStore'

const RootRedirect = () => {
  const role = authStore((state) => state.user?.role)
  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }
  return <Navigate to="/activities" replace />
}

const DashboardRedirect = () => {
  return <Navigate to="/admin/dashboard" replace />
}

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authStore((state) => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/activate-account" element={<ActivateAccount />} />

        {/* ── Protected Dashboard/Portal Layout Wrapper ──────────────── */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          
          <Route path="/admin/activity-types" element={<ActivityTypesAdmin />} />
          <Route path="/admin/activities" element={<ActivitiesAdmin />} />
          
          <Route path="/activities" element={<ActivitiesCatalog />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />
          <Route path="/my-registrations" element={<MyRegistrations />} />
          
          <Route path="/admin/registrations" element={<RegistrationsAdmin />} />
          <Route path="/admin/qr-scanner" element={<QrScannerAdmin />} />

          {/* Tickets Pluxee */}
          <Route path="/tickets/submit" element={<TicketSubmit />} />
          <Route path="/tickets/my-tickets" element={<MyTickets />} />
          <Route path="/admin/tickets" element={<TicketsAdmin />} />

          {/* Reports & Audit */}
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
          <Route path="/admin/reports" element={<ReportsAdmin />} />
          <Route path="/admin/audit" element={<AuditLogsAdmin />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App
