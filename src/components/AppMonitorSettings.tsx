import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Twitter, Facebook, Video, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { cn } from '../lib/utils';
import { User } from '../types';

interface AppMonitorSettingsProps {
  user: User;
  onUpdate: (updatedMonitoredApps: any) => void;
}

export function AppMonitorSettings({ user, onUpdate }: AppMonitorSettingsProps) {
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  const monitoredApps = user.monitoredApps || {
    instagram: false,
    tiktok: false,
    twitter: false,
    facebook: false
  };

  const handleToggleApp = async (appName: keyof typeof monitoredApps) => {
    if (!auth.currentUser) return;
    
    setLoadingApp(appName);
    try {
      const updatedApps = {
        ...monitoredApps,
        [appName]: !monitoredApps[appName]
      };
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        monitoredApps: updatedApps
      });
      
      onUpdate(updatedApps);
    } catch (error) {
      console.error(`Error toggling ${appName}:`, error);
      alert("Hubo un error al actualizar la preferencia.");
    } finally {
      setLoadingApp(null);
    }
  };

  const apps = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: 'text-blue-400' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-gray-400' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  ] as const;

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-8 rounded-3xl shadow-xl w-full">
      <div className="flex items-center gap-3 mb-2">
        <AlertCircle size={22} className="text-[#FF6B00]" />
        <h3 className="text-xl font-bold font-sans text-on-surface tracking-tight">Redes a Monitorizar</h3>
      </div>
      <p className="font-sans text-sm text-on-surface-variant mb-8 leading-relaxed">Selecciona qué redes debe monitorizar la IA de Reel2Real para activar el "Trigger de Salida".</p>
      
      <div className="space-y-6">
        {apps.map((app) => {
          const isActive = monitoredApps[app.id as keyof typeof monitoredApps] || false;
          const isLoading = loadingApp === app.id;
          
          return (
            <div key={app.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2.5 rounded-2xl shrink-0 transition-colors duration-300", isActive ? "bg-[#FF6B00]/10" : "bg-surface-container")}>
                    <app.icon size={22} className={isActive ? "text-[#FF6B00]" : "text-on-surface-variant"} />
                  </div>
                  <span className="font-sans font-semibold text-lg text-on-surface">{app.name}</span>
                </div>
                
                <button
                  disabled={isLoading}
                  onClick={() => handleToggleApp(app.id as keyof typeof monitoredApps)}
                  className={cn(
                    "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none border-2 border-transparent",
                    isActive ? "bg-[#FF6B00]" : "bg-surface-container-high border-outline-variant/50",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 700, damping: 30 }}
                    className={cn(
                      "inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300",
                      isActive ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              
              <AnimatePresence>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="text-sm font-sans text-on-surface-variant/80 pl-14 leading-relaxed overflow-hidden"
                  >
                    La IA de Reel2Real analizará tu actividad en {app.name} para sugerirte planes cuando detecte fatiga digital.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
