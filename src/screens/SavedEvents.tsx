import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Calendar, MapPin, Sparkles } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { User, Event } from '../types';
import { useNavigate } from 'react-router-dom';

export function SavedEvents() {
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedEvents = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          if (userData.savedEvents && userData.savedEvents.length > 0) {
            const qSaved = query(
              collection(db, 'events'),
              where(documentId(), 'in', userData.savedEvents)
            );
            const savedSnapshot = await getDocs(qSaved);
            const events = savedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
            setSavedEvents(events);
          }
        }
      } catch (error) {
        console.error("Error fetching saved events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-on-surface pb-32 pt-20 px-6 animate-pulse">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-surface-container rounded-[1rem_1.2rem_0.8rem_1rem]" />
          <div>
            <div className="w-32 h-8 bg-surface-container mb-2 rounded-full" />
            <div className="w-48 h-4 bg-surface-container rounded-full" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest border-2 border-outline-variant rounded-[1.5rem_1rem_1.2rem_1.8rem] overflow-hidden">
              <div className="h-32 w-full bg-surface-container" />
              <div className="p-3">
                <div className="w-full h-4 bg-surface-container mb-2 rounded-full" />
                <div className="w-2/3 h-4 bg-surface-container mb-2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ease: "circOut", duration: 0.3 }}
      className="min-h-screen bg-transparent text-on-surface pb-32 pt-20 px-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary-container text-primary rounded-[1rem_1.2rem_0.8rem_1rem] wobbly-border shadow-[2px_2px_0_0_#450051] rotate-3">
          <Bookmark size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black font-headline italic tracking-tight text-on-surface">Mis Planes</h1>
          <p className="text-on-surface-variant font-label mt-1">Eventos guardados para después</p>
        </div>
      </div>

      {savedEvents.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {savedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                // In a real app we might navigate to event details or open a modal
                console.log('Clicked', event.id);
              }}
              className="bg-surface-container-lowest border-2 border-outline-variant rounded-[1.5rem_1rem_1.2rem_1.8rem] overflow-hidden wobbly-border shadow-[4px_4px_0_0_#9720ab] cursor-pointer hover:-translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#9720ab] transition-all group"
            >
              <div className="h-32 w-full relative">
                <img 
                  src={event.foto_url} 
                  alt={event.titulo} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute top-2 right-2 p-1.5 bg-primary/20 backdrop-blur-md rounded-full text-white border border-primary/30">
                  <Bookmark size={14} fill="currentColor" />
                </div>
              </div>
              <div className="p-3 relative">
                <div className="absolute -top-6 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <h3 className="font-headline font-bold text-sm line-clamp-2 leading-tight mb-2 text-on-surface">{event.titulo}</h3>
                <div className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-wider mb-1">
                  <Calendar size={10} className="text-primary" />
                  <span>{new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant font-label text-[10px] font-bold uppercase tracking-wider mt-1">
                  <MapPin size={10} className="text-secondary" />
                  <span>Madrid</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest border-2 border-outline-variant p-8 rounded-[2.5rem_1.8rem_3rem_2.2rem] text-center flex flex-col items-center wobbly-border shadow-[4px_4px_0_0_#9720ab] mt-12">
          <div className="w-16 h-16 bg-surface-container text-on-surface-variant border-2 border-outline-variant rounded-[1.2rem_1rem_1.5rem_0.8rem] flex items-center justify-center mb-4 wobbly-border -rotate-6">
            <Sparkles size={32} />
          </div>
          <p className="text-on-surface font-label font-bold">No tienes planes guardados aún.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 text-primary font-bold font-headline uppercase tracking-wide border-b-2 border-primary pb-1 hover:text-secondary hover:border-secondary transition-colors"
          >
            Explorar Eventos
          </button>
        </div>
      )}
    </motion.div>
  );
}
