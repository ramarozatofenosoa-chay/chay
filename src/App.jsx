import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { Navigate } from 'react-router-dom';
// Add page imports here
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Bible from '@/pages/Bible';
import Media from '@/pages/Media';
import Games from '@/pages/Games';
import Kids from '@/pages/Kids';
import Community from '@/pages/Community';
import Donate from '@/pages/Donate';
import Contact from '@/pages/Contact';
import Admin from '@/pages/Admin';
import Messages from '@/pages/Messages';
import SplashScreen from '@/components/SplashScreen';
import { AudioPlayerProvider } from '@/lib/AudioPlayerContext';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 4500);
    return () => clearTimeout(t);
  }, []);

  // Show splash for at least 4.5s, and while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth || !minSplashDone) {
    return <SplashScreen />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/bible" element={<Bible />} />
          <Route path="/media" element={<Media />} />
          <Route path="/games" element={<Games />} />
          <Route path="/kids" element={<Kids />} />
          <Route path="/community" element={<Community />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/messages" element={<Messages />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AudioPlayerProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </AudioPlayerProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App