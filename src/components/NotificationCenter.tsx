import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Sparkles, Calendar, Clock } from 'lucide-react';
import { notificationService } from '../services/NotificationService';
import { cn } from '../lib/utils';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      notificationService.sendLocalNotification(
        "¡Notificaciones Activadas!",
        "Te avisaremos 24h y 1h antes de tus eventos confirmados."
      );
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 z-[60] p-3 bg-white/80 backdrop-blur-md border border-black/5 rounded-full shadow-lg hover:scale-110 transition-transform text-gray-600"
      >
        <div className="relative">
          <Bell size={20} />
          {!hasPermission && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-start justify-end p-6"
          >
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[35px] shadow-2xl overflow-hidden flex flex-col border border-black/5"
            >
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bell className="text-blue-500" size={20} />
                  <h3 className="font-bold text-gray-900">Notificaciones</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 flex-1">
                {!hasPermission ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BellOff size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Activa los Avisos</h4>
                    <p className="text-sm text-gray-400 mb-6">
                      Para recibir recordatorios de tus eventos, necesitamos tu permiso.
                    </p>
                    <button 
                      onClick={handleRequestPermission}
                      className="w-full bg-blue-500 text-white py-4 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                    >
                      Permitir Notificaciones
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                      <div className="p-2 bg-green-500 text-white rounded-lg">
                        <Sparkles size={16} />
                      </div>
                      <p className="text-xs font-medium text-green-700">
                        Recordatorios inteligentes activados (24h y 1h antes).
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Próximos Avisos</h4>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Calendar size={16} className="text-blue-500" />
                        <span className="text-xs text-gray-600">24h antes del evento</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Clock size={16} className="text-blue-500" />
                        <span className="text-xs text-gray-600">1h antes de comenzar</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 text-center">
                <p className="text-[10px] text-gray-400 font-medium">
                  Zenith Intelligence • v1.0
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
