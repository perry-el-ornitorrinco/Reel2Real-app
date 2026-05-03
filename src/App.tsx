import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { BusinessDashboard } from './screens/BusinessDashboard';
import { MatchChat } from './screens/MatchChat';
import { AuthScreen } from './screens/AuthScreen';
import UserProfile from './screens/UserProfile';
import { AttendedEventsScreen } from './screens/AttendedEventsScreen';
import { SavedEvents } from './screens/SavedEvents';
import { GlassNavBar } from './components/GlassNavBar';
import { NotificationCenter } from './components/NotificationCenter';
import { notificationService } from './services/NotificationService';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole, User } from './types';
import { cn } from './lib/utils';

function MainRoutes({ userRole }: { userRole: UserRole }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={userRole === 'user' ? <DiscoverScreen /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={userRole === 'business' ? <BusinessDashboard /> : <Navigate to="/" />} />
        <Route path="/matches" element={<MatchChat />} />
        <Route path="/saved" element={<SavedEvents />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/attended-events" element={<AttendedEventsScreen />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        notificationService.startReminderCheck(15);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as User;
            setUserRole(data.role || 'user');
            setIsAuthenticated(true);
          } else {
            console.warn("User authenticated but profile document does not exist. Redirecting to onboarding...");
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Error fetching user role", error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) return null;

  return (
    <Router>
      <div className="fixed inset-0 paper-texture pointer-events-none z-0"></div>
      <div className="fixed inset-0 doodle-bg pointer-events-none z-0"></div>
      <div className="fixed top-1/2 -right-12 opacity-10 pointer-events-none z-0">
        <svg width="240" height="240" viewBox="0 0 24 24" fill="currentColor" className="text-primary rotate-12">
          <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a2 2 0 0 0-2.83 0L9 10.83l4.17 4.17 7.54-7.54a2 2 0 0 0 0-2.83z"/>
        </svg>
      </div>
      <div className="fixed bottom-1/4 -left-12 opacity-10 pointer-events-none z-0">
        <svg width="192" height="192" viewBox="0 0 24 24" fill="currentColor" className="text-secondary -rotate-12">
          <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14l-2.5 1.4zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5L22 2zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.71 11.04c.39-.39.39-1.02 0-1.41l-2.34-2.34z"/>
        </svg>
      </div>

      <header className="absolute top-0 left-0 w-full z-40 flex justify-between items-center px-6 py-4 bg-transparent">
        <div className="flex items-center gap-3">
          <span className="font-headline font-black italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container text-2xl tracking-tight">Reel2Real</span>
        </div>
      </header>

      <div className="min-h-screen bg-transparent max-w-lg mx-auto relative overflow-x-hidden shadow-2xl pb-safe pt-safe pt-24">
        {!isAuthenticated ? (
          <AuthScreen onAuthComplete={() => setIsAuthenticated(true)} />
        ) : (
          <>
            <MainRoutes userRole={userRole} />
            <NotificationCenter />
            <GlassNavBar userRole={userRole} />
          </>
        )}
      </div>
    </Router>
  );
}
