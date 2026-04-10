import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Tag, Image as ImageIcon, CreditCard, TrendingUp, Sparkles, X, Calendar, Clock, Users as UsersIcon } from 'lucide-react';
import { HeatmapChart, B2BStatsCard } from '../components/B2BPanel';
import { db, auth } from '../services/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy } from 'firebase/firestore';
import { Event } from '../types';
import { cn } from '../lib/utils';

const BUSINESS_CATEGORIES = [
  "Gastro", "Tech", "Arte", "Bienestar", "Música", "Gaming", "Deporte", "Cultura", "Networking"
];

export const BusinessDashboard: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'Gastro',
    fecha: '',
    hora: '',
    aforo_max: 50,
    isPremium: false
  });

  const fetchMyEvents = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'events'), 
        where('organizador_uid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setMyEvents(fetched);
    } catch (error) {
      console.error("Error fetching my events:", error);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.titulo || !formData.fecha) return;
    
    setLoading(true);
    try {
      const newEvent = {
        ...formData,
        fecha: `${formData.fecha}T${formData.hora || '00:00'}:00Z`,
        organizador_uid: auth.currentUser.uid,
        asistentes_actuales: [],
        ubicacion_gps: { lat: 40.4168, lng: -3.7038 }, // Default to Madrid for demo
        foto_url: `https://picsum.photos/seed/${formData.titulo}/800/600`,
        views: 0,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'events'), newEvent);
      setIsUploading(false);
      setFormData({
        titulo: '',
        descripcion: '',
        categoria: 'Gastro',
        fecha: '',
        hora: '',
        aforo_max: 50,
        isPremium: false
      });
      fetchMyEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-32">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Gestiona tus eventos premium</p>
        </div>
        <button 
          onClick={() => setIsUploading(true)}
          className="p-4 bg-blue-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <B2BStatsCard label="Vistas Totales" value="12.4k" trend="+14%" />
        <B2BStatsCard label="Conversión" value="3.2%" trend="+2%" />
      </div>

      <div className="space-y-8">
        <HeatmapChart />
        
        <div className="bg-white p-8 rounded-[30px] shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Tus Eventos</h3>
            <span className="text-blue-500 text-sm font-bold">Ver todos</span>
          </div>
          
          <div className="space-y-4">
            {myEvents.length > 0 ? (
              myEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 bg-gray-200 rounded-xl overflow-hidden">
                    <img src={event.foto_url} alt="Event" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{event.titulo}</h4>
                    <p className="text-xs text-gray-400">
                      {new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {event.categoria}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-blue-500 text-xs font-bold">
                      <TrendingUp size={12} />
                      <span>{event.views} views</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                No has publicado eventos todavía.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploading && (
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
              className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Nuevo Evento</h3>
                <button onClick={() => setIsUploading(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleCreateEvent}>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Tag size={18} />
                    </div>
                    <input 
                      required
                      type="text" 
                      placeholder="Título del evento" 
                      value={formData.titulo}
                      onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute left-4 top-4 text-gray-400">
                      <Sparkles size={18} />
                    </div>
                    <textarea 
                      placeholder="Descripción detallada" 
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all h-32 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Calendar size={18} />
                      </div>
                      <input 
                        required
                        type="date" 
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Clock size={18} />
                      </div>
                      <input 
                        type="time" 
                        value={formData.hora}
                        onChange={(e) => setFormData({...formData, hora: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <UsersIcon size={18} />
                      </div>
                      <input 
                        type="number" 
                        placeholder="Aforo" 
                        value={formData.aforo_max}
                        onChange={(e) => setFormData({...formData, aforo_max: parseInt(e.target.value)})}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <select 
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none text-sm"
                    >
                      {BUSINESS_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isPremium: !formData.isPremium})}
                    className={cn(
                      "w-full py-4 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-all",
                      formData.isPremium ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    <CreditCard size={20} />
                    {formData.isPremium ? "Evento Premium Activado" : "Destacar Evento (Premium)"}
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-4 rounded-full font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Publicar Evento"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
