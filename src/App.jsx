import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  ClerkProvider, 
  SignedIn, 
  SignedOut, 
  RedirectToSignIn,
  useAuth
} from '@clerk/clerk-react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ToastContainer from './components/common/ToastContainer';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import MatchingPage from './pages/MatchingPage';
import ChatPage from './pages/ChatPage';
import MeetingPage from './pages/MeetingPage';
import Loading from './components/common/Loading';

// Get publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return <Loading />;
  }
  
  return isSignedIn ? <Navigate to="/dashboard" replace /> : children;
};

// App Layout Component with Toast Container
const AppLayoutWithToast = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { toasts, removeToast } = useToast();
  
  if (!isLoaded) {
    return <Loading />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isSignedIn && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {isSignedIn && <Footer />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// App Layout Component
const AppLayout = ({ children }) => {
  return (
    <ToastProvider>
      <AppLayoutWithToast>
        {children}
      </AppLayoutWithToast>
    </ToastProvider>
  );
};

// Main App Component with Routing
const AppRoutes = () => {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/matching" element={
            <ProtectedRoute>
              <MatchingPage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/meeting" element={
            <ProtectedRoute>
              <MeetingPage />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;
