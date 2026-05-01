import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, where, limit, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, RefreshCcw, LogIn, Filter, X, Calendar, SlidersHorizontal, Search, Bookmark, Bell, Navigation } from 'lucide-react';
import { db, auth, signInWithGoogle } from '../services/firebase';
import { SwipeCard } from '../components/SwipeCard';
import { Event, User } from '../types';
import { calculateJaccardSimilarity, generateProactivePlans } from '../services/aiRecommendationEngine';
import { applyAssociationRules, calculateAffinityScore } from '../services/AssociationEngine';
import { getCurrentLocation, calculateDistance } from '../services/locationService';
import { useBackgroundTimer } from '../hooks/useBackgroundTimer';
import { cn } from '../lib/utils';
import { seedBetaEvents } from '../services/seedBeta';
import { MAJOR_CITIES } from '../constants/locations';

import { notificationService } from '../services/NotificationService';
import { logTelemetry } from '../services/telemetryService';

export const DiscoverScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [homePlans, setHomePlans] = useState<Event[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [simplifiedUI, setSimplifiedUI] = useState(false);
  
  const appSessionStart = useRef<number>(Date.now());

  const [filters, setFilters] = useState({
    category: 'All',
    maxDistance: 20,
    date: '',
    city: MAJOR_CITIES[0] // Default to 'Mi Ubicación'
  });
  
  // Exit Technology KPI: 3 minutes Anti-Retention limit
  const { showWellnessModal, setShowWellnessModal, resetTimer } = useBackgroundTimer(3);

  useEffect(() => {
    // Read simplified UI trigger from previous telemetry
    setSimplifiedUI(localStorage.getItem('reel2real_simplified_ui') === 'true');
    appSessionStart.current = Date.now();
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', firebaseUser.uid)));
          if (!userDoc.empty) {
            setUser(userDoc.docs[0].data() as User);
          } else {
            // Fallback for new/incomplete users
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              intereses: ["Tecnología", "Música", "Arte"],
              hashtags_redes: ["#ai", "#coding", "#minimalism"],
              ubicacion: { lat: 40.4168, lng: -3.7038 },
              timeSpentToday: 0
            });
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const init = async () => {
      await seedBetaEvents();
      fetchEvents();
    };
    init();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let location;
      if (filters.city.lat && filters.city.lng) {
        location = { lat: filters.city.lat, lng: filters.city.lng };
      } else {
        location = await getCurrentLocation();
      }

      const q = query(
        collection(db, 'events'), 
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      
      let fetchedEvents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

      // Client-side sort by createdAt desc
      fetchedEvents.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      // Filter by distance
      fetchedEvents = fetchedEvents.filter(event => {
        const dist = calculateDistance(location.lat, location.lng, event.ubicacion_gps.lat, event.ubicacion_gps.lng);
        return dist <= filters.maxDistance;
      });

      // Filter by category
      if (filters.category !== 'All') {
        fetchedEvents = fetchedEvents.filter(event => event.categoria === filters.category);
      }

      // Filter by date
      if (filters.date) {
        fetchedEvents = fetchedEvents.filter(event => event.fecha.startsWith(filters.date));
      }

      // AI Clustering & Association
      if (user) {
        const expandedInterests = applyAssociationRules(user.intereses, []); // Pass history if available
        
        fetchedEvents.sort((a, b) => {
          const scoreA = calculateAffinityScore(expandedInterests, a, user.hashtags_redes);
          const scoreB = calculateAffinityScore(expandedInterests, b, user.hashtags_redes);
          
          // Fallback to Jaccard if scores are equal
          if (scoreA === scoreB) {
            const simA = calculateJaccardSimilarity(user.hashtags_redes, [a.categoria]);
            const simB = calculateJaccardSimilarity(user.hashtags_redes, [b.categoria]);
            return simB - simA;
          }
          
          return scoreB - scoreA;
        });
      }

      if (fetchedEvents.length === 0 && user) {
        // Trigger Gemini for Zero Results - Cold Start Solution
        setLoading(true);
        const plans = await generateProactivePlans(user.intereses, location.lat, location.lng);
        setHomePlans(plans); // These are full Event objects now
      } else {
        setEvents(fetchedEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const recordTTR = async () => {
    await logTelemetry();
  };

  const handleSwipe = async (direction: 'left' | 'right', eventId: string) => {
    // Optimistic UI Component (5G Low Latency spec)
    setEvents(prev => prev.filter(e => e.id !== eventId));
    
    if (direction === 'right' && auth.currentUser) {
      // Record TTR on decision
      recordTTR();
      try {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          asistentes_actuales: arrayUnion(auth.currentUser.uid)
        });
        console.log("Matched and joined event:", eventId);
      } catch (error) {
        console.error("Error joining event:", error);
      }
    }
  };

  const handleSave = async (eventId: string) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        savedEvents: arrayUnion(eventId)
      });
      alert("Evento guardado para después");
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleSetReminder = async () => {
    if (!selectedEvent || !reminderTime) return;
    await notificationService.scheduleCustomReminder(
      selectedEvent.id,
      `Reel2Real: Tu evento "${selectedEvent.titulo}" comienza pronto.`,
      new Date(reminderTime)
    );
    setShowReminderPicker(false);
    setReminderTime('');
  };

  const filteredEvents = events.filter(event => 
    event.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <div className="w-20 h-20 bg-blue-500 rounded-[25px] flex items-center justify-center mb-8 shadow-xl">
          <Sparkles className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Reel2Real</h1>
        <p className="text-gray-500 mb-12 max-w-xs">Menos pantalla, más calle. Encuentra planes diseñados para ti.</p>
        <button 
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-lg"
        >
          <LogIn size={20} />
          Continuar con Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-6 pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="font-headline text-5xl font-black italic tracking-tighter text-on-surface">Descubrir</h2>
          <div className="flex items-center gap-1 font-label text-sm mt-1 text-on-surface-variant font-bold">
            <MapPin size={16} className="text-primary" />
            <span>{filters.city.name === 'Mi Ubicación' ? 'Madrid, ES' : `${filters.city.name}, ES`}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {!simplifiedUI && (
            <button 
              onClick={() => setShowFilters(true)}
              className={cn(
                "p-3 rounded-full transition-all wobbly-border border-2",
                showFilters || filters.category !== 'All' || filters.maxDistance !== 20 || filters.date 
                  ? "bg-primary border-primary text-on-primary shadow-[2px_2px_0px_#ea73fb] translate-y-[-1px] translate-x-[-1px]" 
                  : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary hover:bg-surface-container"
              )}
            >
              <SlidersHorizontal size={20} />
            </button>
          )}
          <button 
            onClick={fetchEvents}
            className="p-3 bg-surface-container-lowest border-2 border-outline-variant rounded-full text-on-surface hover:border-primary hover:bg-surface-container transition-all wobbly-border"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      {!simplifiedUI && (
        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Buscar eventos, música, arte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant rounded-full text-on-surface font-medium placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-0 transition-all shadow-[2px_2px_0px_#ea73fb]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-surface-container-lowest w-full max-w-lg rounded-[2.5rem_1.8rem_0_0] sm:rounded-[2.5rem_1.8rem_3rem_2.2rem] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t-2 sm:border-2 border-primary/20 wobbly-border"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-extrabold text-white tracking-tight">Filtros</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Category Filter */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Gastro', 'Tech', 'Arte', 'Bienestar', 'Música'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilters({ ...filters, category: cat })}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          filters.category === cat 
                            ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-[0_4px_14px_rgba(255,107,0,0.4)]" 
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Filter */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Distancia Máxima</label>
                    <span className="text-sm font-bold text-[#FF6B00]">{filters.maxDistance} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]"
                  />
                </div>

                {/* Date Filter */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Calendar size={18} />
                    </div>
                    <input 
                      type="date" 
                      value={filters.date}
                      onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 rounded-2xl border border-white/10 focus:ring-2 focus:ring-[#FF6B00] outline-none transition-all text-white"
                    />
                  </div>
                </div>

                {/* City Filter */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ciudad / Ubicación</label>
                  <div className="flex flex-wrap gap-2">
                    {MAJOR_CITIES.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => setFilters({ ...filters, city })}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          filters.city.name === city.name 
                            ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-[0_4px_14px_rgba(255,107,0,0.4)]" 
                            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                        )}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                      setFilters({ category: 'All', maxDistance: 20, date: '', city: MAJOR_CITIES[0] });
                    }}
                    className="flex-1 py-4 rounded-full font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Limpiar
                  </button>
                  <button 
                    onClick={() => {
                      fetchEvents();
                      setShowFilters(false);
                    }}
                    className="flex-[2] bg-[#FF6B00] text-white py-4 rounded-full font-bold shadow-[0_8px_30px_rgba(255,107,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center justify-center min-h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length > 0 || homePlans.length > 0 ? (
          <>
            <div className="relative w-full h-[550px] flex justify-center mt-4">
              <AnimatePresence>
                {(() => {
                  const eventsList = filteredEvents.length > 0 ? filteredEvents : homePlans;
                  const visibleEvents = eventsList.slice(0, 3).reverse();
                  
                  // Preload the image of the next card not currently visible
                  if (eventsList.length > 3) {
                    const nextImage = new Image();
                    nextImage.src = eventsList[3].foto_url;
                  }

                  return visibleEvents.map((event, index) => {
                    const isTopCard = index === visibleEvents.length - 1;
                    return (
                      <SwipeCard 
                        key={event.id || `idx-${event.titulo}`}
                        event={event} 
                        isActive={isTopCard}
                        onSwipe={(dir) => handleSwipe(dir, event.id)} 
                        onSave={handleSave}
                        onClick={() => setSelectedEvent(event)}
                      />
                    );
                  });
                })()}
              </AnimatePresence>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 w-full relative z-20">
              <button 
                onClick={() => handleSwipe('left', filteredEvents.length > 0 ? filteredEvents[0].id : homePlans[0].id)}
                className="w-16 h-16 rounded-[1.5rem_1rem_1.8rem_1.2rem] bg-surface-container-lowest text-error flex items-center justify-center shadow-[4px_4px_0_0_#b4134020] hover:scale-110 hover:-rotate-6 transition-all active:scale-95 border-2 border-outline-variant wobbly-border"
              >
                <X size={28} strokeWidth={3} />
              </button>
              <button 
                onClick={() => handleSwipe('right', filteredEvents.length > 0 ? filteredEvents[0].id : homePlans[0].id)}
                className="w-20 h-20 rounded-[2rem_1.5rem_2.2rem_1.8rem] bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center shadow-[6px_6px_0_0_#89089e] hover:scale-110 transition-all active:scale-95 group wobbly-border border-2 border-primary-dim"
              >
                <motion.div whileTap={{ scale: 1.2 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-on-primary group-hover:fill-1">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </motion.div>
              </button>
              <button className="w-16 h-16 rounded-[1.2rem_1.8rem_1rem_1.5rem] bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-[4px_4px_0_0_#005e9f20] hover:scale-110 hover:rotate-6 transition-all active:scale-95 border-2 border-tertiary wobbly-border">
                <Sparkles size={28} />
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-1 opacity-40 mb-16 relative z-10 pointer-events-none">
              <span className="font-label text-[10px] text-on-surface uppercase tracking-[0.2em] font-bold">Swipe to Explore</span>
              <motion.div 
                animate={{ y: [0, 8, 0] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-on-surface"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m19 12-7 7-7-7"/><path d="m19 5-7 7-7-7"/>
                </svg>
              </motion.div>
            </div>
          </>
        ) : (
          <div className="text-center text-on-surface-variant font-medium mt-20">
            No hay más eventos por hoy.
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-md flex items-end justify-center sm:items-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-surface-container-lowest border-t-2 border-outline-variant w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-[2.5rem_1.8rem_0_0] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none z-50">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <div className="relative h-72 shrink-0 wobbly-border overflow-hidden m-2 border-2 border-primary-container">
                <img 
                  src={selectedEvent.foto_url} 
                  alt={selectedEvent.titulo} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => {
                    setSelectedEvent(null);
                    setShowReminderPicker(false);
                  }}
                  className="absolute top-4 right-4 p-3 bg-surface-container-lowest/80 backdrop-blur-md text-on-surface rounded-full hover:bg-surface-container transition-colors shadow-md border-2 border-primary/20"
                >
                  <X size={24} />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-on-surface z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#89089e]">
                      {selectedEvent.categoria}
                    </span>
                    {selectedEvent.isPremium && (
                      <span className="px-3 py-1 bg-tertiary text-on-tertiary rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#003258]">
                        Premium
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold leading-tight font-headline text-white">{selectedEvent.titulo}</h2>
                </div>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative">
                <div className="absolute -top-12 -right-4 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[10rem] text-primary rotate-12">auto_fix_high</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-surface-container-lowest border-2 border-outline-variant wobbly-border flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none group-hover:-rotate-12 transition-transform">
                      <Calendar size={60} />
                    </div>
                    <div className="p-2 bg-primary-container text-primary rounded-xl flex-shrink-0 z-10">
                      <Calendar size={18} />
                    </div>
                    <div className="overflow-hidden z-10">
                      <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Fecha</p>
                      <p className="text-sm font-bold text-on-surface truncate">
                        {new Date(selectedEvent.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container-lowest border-2 border-outline-variant wobbly-border flex items-center gap-3 relative overflow-hidden group">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none group-hover:rotate-12 transition-transform">
                      <MapPin size={60} />
                    </div>
                    <div className="p-2 bg-secondary-container text-secondary rounded-xl flex-shrink-0 z-10">
                      <MapPin size={18} />
                    </div>
                    <div className="overflow-hidden z-10">
                      <p className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Lugar</p>
                      <p className="text-sm font-bold text-on-surface truncate">Madrid, ES</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <div>
                    <h3 className="font-label text-sm font-bold text-primary uppercase tracking-widest mb-3">Descripción</h3>
                    <p className="font-body text-on-surface leading-relaxed text-lg">
                      {selectedEvent.descripcion}
                    </p>
                  </div>

                  {/* Organizer Details */}
                  <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-2xl p-4 flex items-center justify-between wobbly-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center justify-center font-bold">
                        {selectedEvent.organizador_uid ? 'OG' : 'R2'}
                      </div>
                      <div>
                        <p className="font-label text-xs text-on-surface-variant font-bold uppercase tracking-wider">Organizado por</p>
                        <p className="text-sm font-bold text-on-surface">
                          {selectedEvent.organizador_uid ? 'Organizador Local' : 'Reel2Real Official'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => console.log('Ver perfil')} className="text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors border border-primary/20">
                      Ver Perfil
                    </button>
                  </div>

                  {/* Mock Map Preview */}
                  <div className="rounded-[1.5rem_2rem_1rem_2.2rem] overflow-hidden border-2 border-outline-variant relative h-32 bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity">
                    <img 
                      src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-s+007AFF(${selectedEvent.ubicacion_gps?.lng || -3.7038},${selectedEvent.ubicacion_gps?.lat || 40.4168})/${selectedEvent.ubicacion_gps?.lng || -3.7038},${selectedEvent.ubicacion_gps?.lat || 40.4168},14,0/600x300?access_token=pk.ey`} 
                      alt="Map view" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to a generic abstract map-like placeholder if no token/API provided
                        e.currentTarget.src = "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&h=300&q=80";
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                      <p className="text-white text-xs font-medium">Ver cómo llegar</p>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/10 rounded-[30px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] bg-gray-600 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-bold text-gray-300">
                        <span className="text-[#FF6B00]">+{selectedEvent.asistentes_actuales.length}</span> asist.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Aforo</p>
                      <p className="text-sm font-extrabold text-[#FF6B00]">{selectedEvent.aforo_max}</p>
                    </div>
                  </div>

                  {/* Custom Reminder Picker */}
                  <AnimatePresence>
                    {showReminderPicker && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 p-6 rounded-[30px] border border-blue-100"
                      >
                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Bell size={16} className="text-blue-500" />
                          Configurar Aviso
                        </h4>
                        <div className="flex flex-col gap-4">
                          <input 
                            type="datetime-local" 
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-full px-4 py-3 bg-white rounded-xl border-none ring-1 ring-black/5 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowReminderPicker(false)}
                              className="flex-1 py-3 text-xs font-bold text-gray-400"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={handleSetReminder}
                              disabled={!reminderTime}
                              className="flex-2 bg-blue-500 text-white py-3 rounded-full font-bold text-xs shadow-md disabled:opacity-50"
                            >
                              Programar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-6 shrink-0 bg-surface-container-lowest border-t-2 border-outline-variant flex gap-3 relative z-20">
                <button 
                  onClick={() => handleSave(selectedEvent.id)}
                  className="w-16 h-16 bg-surface-container-low text-primary rounded-xl font-bold flex items-center justify-center border-2 border-outline-variant wobbly-border hover:bg-surface-container transition-all shadow-[2px_2px_0px_#ea73fb] translate-y-[-1px] translate-x-[-1px]"
                  title="Guardar para después"
                >
                  <Bookmark size={24} />
                </button>
                <button 
                  onClick={() => setShowReminderPicker(!showReminderPicker)}
                  className={cn(
                    "w-16 h-16 rounded-[1rem_1.2rem_0.8rem_1rem] flex items-center justify-center transition-all border-2 border-outline-variant",
                    showReminderPicker 
                      ? "bg-primary text-on-primary shadow-[2px_2px_0px_#450051] border-primary translate-y-[1px] translate-x-[1px]" 
                      : "bg-surface-container-low text-primary hover:bg-surface-container shadow-[2px_2px_0px_#ea73fb] translate-y-[-1px] translate-x-[-1px]"
                  )}
                  title="Aviso personalizado"
                >
                  <Bell size={24} />
                </button>

                {selectedEvent.ticketUrl ? (
                  <a 
                    href={selectedEvent.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={recordTTR}
                    className="flex-1 py-4 bg-primary text-on-primary rounded-[1.2rem_0.8rem_1rem_0.9rem] font-headline font-bold text-lg shadow-[4px_4px_0_0_#450051] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 wobbly-border"
                  >
                    Comprar Entrada {selectedEvent.price ? `(${selectedEvent.price}€)` : ''}
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      handleSwipe('right', selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                    className="flex-1 py-4 bg-tertiary text-on-tertiary rounded-[0.8rem_1.2rem_0.9rem_1rem] font-headline font-bold text-lg shadow-[4px_4px_0_0_#001e30] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 wobbly-border border-2 border-transparent"
                  >
                    Confirmar Asistencia
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ExitOverlay (Decision Capsule) */}
      <AnimatePresence>
        {showWellnessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface-container-lowest/30 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-container-lowest border-2 border-outline-variant p-10 rounded-[2.5rem_1.8rem_3rem_2.2rem] shadow-[4px_4px_0_0_#9720ab] max-w-sm text-center relative wobbly-border"
            >
              <div className="absolute -top-4 -right-4 opacity-50 text-tertiary">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5M16 19H8.5M19 12H5"/>
                </svg>
              </div>
              <div className="w-16 h-16 bg-primary-container text-primary rounded-[1rem_1.2rem_0.8rem_1rem] flex items-center justify-center mx-auto mb-6 border-2 border-primary wobbly-border rotate-3 shadow-[2px_2px_0_0_#450051]">
                <Navigation size={32} />
              </div>
              <h3 className="text-2xl font-black font-headline italic tracking-tight text-on-surface mb-4">Cápsula de Decisión</h3>
              <p className="text-on-surface-variant font-label mb-8 leading-relaxed">
                Has superado los 3 minutos de retención. El objetivo es salir a la calle, no quedarte en la app. Tienes un plan de <span className="text-primary font-bold">{user.intereses[0] || 'tu interés'}</span> esperándote.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                     setShowWellnessModal(false); 
                  }}
                  className="bg-primary text-on-primary py-4 rounded-[1.2rem_0.8rem_1.5rem_1rem] font-bold shadow-[4px_4px_0_0_#450051] hover:scale-105 active:scale-95 transition-all text-lg wobbly-border"
                >
                  Cerrar App y Salir 🚪
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
