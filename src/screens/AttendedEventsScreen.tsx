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
    <div className="min-h-screen flex items-center justify-center bg-transparent mt-20">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ease: "circOut", duration: 0.3 }}
      className="min-h-screen bg-transparent text-on-surface pb-32"
    >
      {/* Header */}
      <header className="p-6 flex items-center gap-4 sticky top-0 bg-surface/80 backdrop-blur-md z-10 border-b-2 border-outline-variant border-dashed">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-primary hover:bg-surface-container rounded-full transition-colors border-2 border-transparent hover:border-outline-variant wobbly-border"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-black font-headline italic text-on-surface tracking-tight">Mi Historial</h1>
      </header>

      <div className="p-6 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-container text-primary border-2 border-primary rounded-xl rotate-3 shadow-[2px_2px_0_0_#450051] wobbly-border">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black font-headline text-on-surface tracking-tight">Eventos Asistidos</h2>
            <p className="text-on-surface-variant font-label text-sm mt-1">Tu trayectoria en Reel2Real</p>
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
                  className="bg-surface-container-lowest p-5 rounded-[2rem_1.5rem_2.2rem_1rem] flex flex-col gap-4 border-2 border-outline-variant wobbly-border hover:border-primary transition-all group shadow-[2px_2px_0px_#ea73fb] hover:-translate-y-1 hover:translate-x-1"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-[1.2rem_0.8rem_1rem_1.5rem] overflow-hidden shrink-0 shadow-sm border-2 border-outline-variant wobbly-border">
                      <img 
                        src={event.foto_url} 
                        alt={event.titulo} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-primary-container text-primary border-2 border-primary rounded-full text-[8px] font-black uppercase tracking-wider wobbly-border shadow-[1px_1px_0_0_#450051]">
                          {event.categoria}
                        </span>
                        {isPast && (
                          <span className="px-2 py-0.5 bg-surface-container-high text-on-surface border-2 border-outline-variant rounded-full text-[8px] font-black uppercase tracking-wider wobbly-border">
                            Finalizado
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold font-headline text-on-surface text-lg truncate">{event.titulo}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-wider">
                          <Calendar size={12} className="text-secondary" />
                          <span>{new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t-2 border-outline-variant border-dashed mt-2">
                    <div className="flex items-center gap-1 text-tertiary">
                      <Star size={14} fill="currentColor" />
                      <span className="font-label text-xs font-bold uppercase">Evento Premium</span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-wider">
                      <MapPin size={12} className="text-primary" />
                      <span>Madrid, ES</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="bg-surface-container-lowest border-2 border-outline-variant p-12 rounded-[2.5rem_1.8rem_3rem_2.2rem] text-center flex flex-col items-center wobbly-border shadow-[4px_4px_0_0_#9720ab]">
              <div className="w-16 h-16 bg-surface-container text-on-surface-variant border-2 border-outline-variant rounded-[1.2rem_1rem_1.5rem_0.8rem] flex items-center justify-center mb-4 wobbly-border -rotate-6">
                <Sparkles size={32} />
              </div>
              <p className="text-on-surface font-label font-bold text-lg">Aún no has asistido a ningún evento.</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-6 text-primary font-bold font-headline text-lg relative uppercase tracking-wide group"
              >
                Explorar eventos ahora
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
