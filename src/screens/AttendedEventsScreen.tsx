import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, MapPin, Sparkles, History, Star } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Event } from '../types';
import { useNavigate } from 'react-router-dom';

export const AttendedEventsScreen: React.FC = () => {
  const [attendedEvents, setAttendedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendedEvents = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'events'),
          where('asistentes_actuales', 'array-contains', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
        
        // Sort by date (past first)
        events.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        
        setAttendedEvents(events);
      } catch (error) {
        console.error("Error fetching attended events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendedEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <header className="p-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-gray-50">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Mi Historial</h1>
      </header>

      <div className="p-6 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Eventos Asistidos</h2>
            <p className="text-gray-400 text-sm">Tu trayectoria en Zenith</p>
          </div>
        </div>

        <div className="space-y-4">
          {attendedEvents.length > 0 ? (
            attendedEvents.map((event, index) => {
              const isPast = new Date(event.fecha) < new Date();
              return (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 p-5 rounded-[30px] flex flex-col gap-4 border border-transparent hover:border-blue-100 transition-all group"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                      <img 
                        src={event.foto_url} 
                        alt={event.titulo} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-wider">
                          {event.categoria}
                        </span>
                        {isPast && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full text-[8px] font-black uppercase tracking-wider">
                            Finalizado
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg truncate">{event.titulo}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                          <Calendar size={12} />
                          <span>{new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">Evento Premium</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                      <MapPin size={12} />
                      <span>Madrid, ES</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-gray-50 p-12 rounded-[40px] text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mb-4">
                <Sparkles size={32} />
              </div>
              <p className="text-gray-400 font-medium">Aún no has asistido a ningún evento.</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-6 text-blue-500 font-bold text-sm hover:underline"
              >
                Explorar eventos ahora
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
