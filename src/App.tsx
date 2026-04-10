import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { BusinessDashboard } from './screens/BusinessDashboard';
import { MatchChat } from './screens/MatchChat';
import { AuthScreen } from './screens/AuthScreen';
import UserProfile from './screens/UserProfile';
import { AttendedEventsScreen } from './screens/AttendedEventsScreen';
import { GlassNavBar } from './components/GlassNavBar';
import { NotificationCenter } from './components/NotificationCenter';
import { notificationService } from './services/NotificationService';
import { auth } from './services/firebase';
import { UserRole } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [viewMode, setViewMode] = useState<UserRole>('user');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (user) {
        notificationService.startReminderCheck(15); // Check every 15 mins
      }
    });
    
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) return null;

  return (
    <Router>
      <div className="min-h-screen bg-white max-w-md mx-auto relative overflow-x-hidden shadow-2xl">
        {!isAuthenticated ? (
          <AuthScreen onAuthComplete={() => setIsAuthenticated(true)} />
        ) : (
          <>
            {/* Segmented Control for Admins/Multi-role */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-100/80 backdrop-blur-md p-1 rounded-full flex gap-1 border border-black/5">
              <button 
                onClick={() => setViewMode('user')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                  viewMode === 'user' ? "bg-white text-blue-500 shadow-sm" : "text-gray-400"
                )}
              >
                Explorar
              </button>
              <button 
                onClick={() => setViewMode('business')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                  viewMode === 'business' ? "bg-white text-blue-500 shadow-sm" : "text-gray-400"
                )}
              >
                Gestión
              </button>
            </div>

            <Routes>
              <Route path="/" element={viewMode === 'user' ? <DiscoverScreen /> : <Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<BusinessDashboard />} />
              <Route path="/matches" element={<MatchChat />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/attended-events" element={<AttendedEventsScreen />} />
            </Routes>
            <NotificationCenter />
            <GlassNavBar />
          </>
        )}
      </div>
    </Router>
  );
}
