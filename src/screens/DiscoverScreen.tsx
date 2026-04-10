import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, limit, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, RefreshCcw, LogIn, Filter, X, Calendar, SlidersHorizontal, Search, Bookmark } from 'lucide-react';
import { db, auth, signInWithGoogle } from '../services/firebase';
import { SwipeCard } from '../components/SwipeCard';
import { Event, HomePlan, User } from '../types';
import { calculateJaccardSimilarity, generateHomePlans } from '../services/aiRecommendationEngine';
import { applyAssociationRules, calculateAffinityScore } from '../services/AssociationEngine';
import { getCurrentLocation, calculateDistance } from '../services/locationService';
import { useBackgroundTimer } from '../hooks/useBackgroundTimer';
import { cn } from '../lib/utils';
import { seedBetaEvents } from '../services/seedBeta';

export const DiscoverScreen: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [homePlans, setHomePlans] = useState<HomePlan[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'All',
    maxDistance: 20,
    date: ''
  });
  const { showWellnessModal, setShowWellnessModal, resetTimer } = useBackgroundTimer(20);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore or create mock
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          intereses: ["Tecnología", "Música", "Arte"],
          hashtags_redes: ["#ai", "#coding", "#minimalism"],
          ubicacion: { lat: 40.4168, lng: -3.7038 },
          timeSpentToday: 0
        });
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
      const location = await getCurrentLocation();
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
          const scoreA = calculateAffinityScore(expandedInterests, a.categoria, []);
          const scoreB = calculateAffinityScore(expandedInterests, b.categoria, []);
          
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
        // Trigger Gemini for Zero Results
        const plans = await generateHomePlans(user.intereses);
        setHomePlans(plans);
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

  const handleSwipe = async (direction: 'left' | 'right', eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    if (direction === 'right' && auth.currentUser) {
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
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
        },
        operationType: 'update',
        path: `users/${auth.currentUser.uid}`
      };
      console.error('Firestore Error Details:', JSON.stringify(errInfo));
    }
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Zenith</h1>
        <p className="text-gray-500 mb-12 max-w-xs">Encuentra eventos premium diseñados para ti.</p>
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
    <div className="min-h-screen bg-white p-6 pb-32">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Descubrir</h2>
          <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
            <MapPin size={14} />
            <span>Madrid, ES</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(true)}
            className={cn(
              "p-3 rounded-full transition-colors",
              showFilters || filters.category !== 'All' || filters.maxDistance !== 20 || filters.date 
                ? "bg-blue-500 text-white shadow-lg" 
                : "bg-gray-50 text-gray-400 hover:text-blue-500"
            )}
          >
            <SlidersHorizontal size={20} />
          </button>
          <button 
            onClick={fetchEvents}
            className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-blue-500 transition-colors"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Buscar eventos, música, arte..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

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
              className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Filtros</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
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
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          filters.category === cat 
                            ? "bg-blue-500 text-white shadow-md" 
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
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
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Distancia Máxima</label>
                    <span className="text-sm font-bold text-blue-500">{filters.maxDistance} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                      setFilters({ category: 'All', maxDistance: 20, date: '' });
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
                    className="flex-[2] bg-blue-500 text-white py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex justify-center h-[500px]">
        {loading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="relative w-full h-[550px] flex justify-center">
            <AnimatePresence>
              {filteredEvents.slice().reverse().map((event, index) => (
                <SwipeCard 
                  key={event.id} 
                  event={event} 
                  onSwipe={(dir) => handleSwipe(dir, event.id)} 
                  onSave={handleSave}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : homePlans.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-blue-50 rounded-[25px] p-8 border border-blue-100"
          >
            <div className="flex items-center gap-2 text-blue-600 mb-6 font-bold">
              <Sparkles size={20} />
              <span>Modo Eventos Cero</span>
            </div>
            <h3 className="text-xl font-bold mb-4">No hay eventos cerca, pero Gemini sugiere:</h3>
            <div className="space-y-6">
              {homePlans.map((plan, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
                  <h4 className="font-bold text-gray-900 mb-2">{plan.titulo}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{plan.paso_a_paso[0]}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center text-gray-400 mt-20">
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
              className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="relative h-72 shrink-0">
                <img 
                  src={selectedEvent.foto_url} 
                  alt={selectedEvent.titulo} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {selectedEvent.categoria}
                    </span>
                    {selectedEvent.isPremium && (
                      <span className="px-3 py-1 bg-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Premium
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold leading-tight">{selectedEvent.titulo}</h2>
                </div>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-3xl flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-500 rounded-xl">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(selectedEvent.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-3xl flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-500 rounded-xl">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lugar</p>
                      <p className="text-sm font-bold text-gray-900">Madrid, ES</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Descripción</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {selectedEvent.descripcion}
                    </p>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-[30px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                            <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-bold text-blue-600">
                        +{selectedEvent.asistentes_actuales.length} asistentes confirmados
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Aforo</p>
                      <p className="text-sm font-bold text-blue-600">{selectedEvent.aforo_max}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4 shrink-0 bg-white border-t border-gray-50 flex gap-3">
                <button 
                  onClick={() => handleSave(selectedEvent.id)}
                  className="p-5 bg-gray-100 text-gray-500 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-all"
                  title="Guardar para después"
                >
                  <Bookmark size={24} />
                </button>
                <button 
                  onClick={() => {
                    handleSwipe('right', selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 py-5 bg-gray-900 text-white rounded-full font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  Confirmar Asistencia
                  <Sparkles size={20} className="text-blue-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wellness Modal */}
      <AnimatePresence>
        {showWellnessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/30 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm text-center border border-black/5"
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCcw size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Trigger de Bienestar</h3>
              <p className="text-gray-500 mb-8">
                Has pasado suficiente tiempo aquí. Hay un evento de <span className="text-blue-500 font-bold">{user.intereses[0]}</span> a 500m. ¿Vamos?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowWellnessModal(false)}
                  className="bg-blue-500 text-white py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                >
                  ¡Vamos!
                </button>
                <button 
                  onClick={resetTimer}
                  className="text-gray-400 py-2 text-sm font-medium"
                >
                  Quizás más tarde
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
