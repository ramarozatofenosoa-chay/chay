import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import HardwareBackHandler from '@/components/HardwareBackHandler';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Settings from '@/pages/Settings';
import Notifications from '@/pages/Notifications';
import { PreferencesProvider } from '@/lib/PreferencesContext';
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
import AppLoader from '@/components/AppLoader';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AudioPlayerProvider } from '@/lib/AudioPlayerContext';
import { RadioPlayerProvider } from '@/lib/RadioContext';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, checkAppState } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    return <AppLoader offline={offline} />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    } else {
      // unknown — généralement un problème de connexion
      return <AppLoader offline retry={checkAppState} />;
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
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AuthProvider>
      <PreferencesProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AudioPlayerProvider>
          <RadioPlayerProvider>
          <Router>
            <ScrollToTop />
            <HardwareBackHandler />
            <ErrorBoundary>
              <AuthenticatedApp />
            </ErrorBoundary>
            <AnimatePresence>
              {showSplash && <SplashScreen key="splash" />}
            </AnimatePresence>
          </Router>
            <Toaster />
          </RadioPlayerProvider>
          </AudioPlayerProvider>
      </QueryClientProvider>
      </PreferencesProvider>
    </AuthProvider>
  )
}

export default App