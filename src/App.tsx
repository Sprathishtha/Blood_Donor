import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { RegisterSelect } from './pages/RegisterSelect';
import { DonorRegister } from './pages/DonorRegister';
import { BloodBankRegister } from './pages/BloodBankRegister';
import { BloodBankDashboard } from './pages/BloodBankDashboard';
import { BloodBankHistory} from './pages/BloodBankHistory';
// import { BloodBankNotifications } from './pages/BloodBankNotifications';
import { HospitalRegister } from './pages/HospitalRegister';
import { DonorDashboard } from './pages/DonorDashboard';
import { DonorNotifications } from './pages/DonorNotifications';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { NewRequest } from './pages/NewRequest';
import { History } from './pages/History';
import { Features } from './pages/Features';
import { ContactUs } from './pages/ContactUs';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { HowItWorks } from './pages/HowItWorks';

function ProtectedRoute({
  children,
  allowedType,
}: {
  children: JSX.Element;
  allowedType: 'donor' | 'hospital' | 'bloodbank';
}) {
  const { user, userType, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (userType !== allowedType) return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/features" element={<Features />} />
      <Route path="/contact" element={<ContactUs />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterSelect />} />
      <Route path="/register/donor" element={<DonorRegister />} />
      <Route path="/register/hospital" element={<HospitalRegister />} />
      <Route path="/register/bloodbank" element={<BloodBankRegister />} />
      {/* <Route path="/bloodbank/notifications" element={<BloodBankNotifications />} /> */}
      {/* Donor */}
      <Route
        path="/donor/dashboard"
        element={
          <ProtectedRoute allowedType="donor">
            <DonorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor/notifications"
        element={
          <ProtectedRoute allowedType="donor">
            <DonorNotifications />
          </ProtectedRoute>
        }
      />

      {/* Hospital */}
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute allowedType="hospital">
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/new-request"
        element={
          <ProtectedRoute allowedType="hospital">
            <NewRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/history"
        element={
          <ProtectedRoute allowedType="hospital">
            <History />
          </ProtectedRoute>
        }
      />

      {/* Blood Bank */}
      <Route
        path="/bloodbank/dashboard"
        element={
          <ProtectedRoute allowedType="bloodbank">
            <BloodBankDashboard />
          </ProtectedRoute>
        }
      />
      <Route
  path="/bloodbank/history"
  element={<BloodBankHistory />}
/>
      {/* <Route
        path="/bloodbank/notifications"
        element={
          <ProtectedRoute allowedType="bloodbank">
            <BloodBankNotifications />
          </ProtectedRoute>
        }
      /> */}

      {/* Common */}
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}