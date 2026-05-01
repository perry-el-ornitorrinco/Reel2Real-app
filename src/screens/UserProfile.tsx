import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Shield, Tag, Save, LogOut, ChevronLeft, Calendar, MapPin, Sparkles, Bookmark, History, Instagram, Twitter, Linkedin } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { User, Event } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_TAGS = [
  "#Gaming", "#Vegan", "#Tardeo", "#Deporte", "#Cultura", 
  "#Tech", "#Música", "#Arte", "#Networking", "#Yoga",
  "#Café", "#Lectura", "#Outdoor", "#Moda", "#Gastro"
];

export default function UserProfile() {
  const [userData, setUserData] = useState<User | null>(null);
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([]);
  const [savedEventsData, setSavedEventsData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return;
      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        let userDataObj: User | null = null;
        if (userDoc.exists()) {
          userDataObj = userDoc.data() as User;
          setUserData(userDataObj);
          setSelectedTags(userDataObj.intereses || []);
        }
        
        if (!userDataObj) return;

        // Fetch interested events
        const q = query(
          collection(db, 'events'),
          where('asistentes_actuales', 'array-contains', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
        setInterestedEvents(events);

        // Fetch saved events
        if (userDataObj.savedEvents && userDataObj.savedEvents.length > 0) {
          const qSaved = query(
            collection(db, 'events'),
            where(documentId(), 'in', userDataObj.savedEvents)
          );
          const savedSnapshot = await getDocs(qSaved);
          const savedEvents = savedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
          setSavedEventsData(savedEvents);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser || selectedTags.length < 5) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        intereses: selectedTags,
        hashtags_redes: selectedTags.map(t => t.toLowerCase())
      });
      // Update local state
      if (userData) {
        setUserData({ ...userData, intereses: selectedTags });
      }
      alert("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
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
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
    <div className="min-h-screen flex items-center justify-center bg-transparent mt-20">
      <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
    </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-transparent text-on-surface pb-32">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Mi Perfil</h1>
        <button 
          onClick={handleLogout}
          className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="p-6 space-y-8">
        {/* User Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-[30px] p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-[#FF6B00] rounded-[30px] flex items-center justify-center mb-4 shadow-[0_8px_30px_rgba(255,107,0,0.4)]">
            <UserIcon size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">{userData.email.split('@')[0]}</h2>
          <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
            <Mail size={14} />
            {userData.email}
          </p>
          <div className="mt-4 px-4 py-1.5 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Shield size={12} />
            {userData.role === 'user' ? 'Usuario Explorador' : 'Empresa / Organizador'}
          </div>

          {userData.digitalHandles && (userData.digitalHandles.instagram || userData.digitalHandles.twitter || userData.digitalHandles.linkedin) && (
            <div className="mt-6 flex gap-4 text-gray-400">
              {userData.digitalHandles.instagram && <Instagram size={18} className="hover:text-[#FF6B00] transition-colors" />}
              {userData.digitalHandles.twitter && <Twitter size={18} className="hover:text-[#FF6B00] transition-colors" />}
              {userData.digitalHandles.linkedin && <Linkedin size={18} className="hover:text-[#FF6B00] transition-colors" />}
            </div>
          )}
        </div>

        {/* Interests Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={20} className="text-[#FF6B00]" />
              <h3 className="text-lg font-extrabold text-white">Mis Intereses</h3>
            </div>
            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full border",
              selectedTags.length >= 5 ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20"
            )}>
              {selectedTags.length}/5 Mínimo
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <motion.button
                  key={tag}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                    isSelected 
                      ? "bg-[#FF6B00] border-[#FF6B00] text-white shadow-[0_4px_14px_rgba(255,107,0,0.4)]" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  {tag}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button 
          disabled={saving || selectedTags.length < 5}
          onClick={handleSave}
          className={cn(
            "w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3",
            selectedTags.length >= 5 
              ? "bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]" 
              : "bg-white/10 text-gray-500 cursor-not-allowed border border-white/5"
          )}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={20} />
              Guardar Cambios
            </>
          )}
        </button>

        {/* History Link */}
        <button 
          onClick={() => navigate('/attended-events')}
          className="w-full py-5 rounded-[25px] bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 font-bold flex items-center justify-center gap-3 hover:bg-[#FF6B00]/20 transition-all"
        >
          <History size={20} />
          Ver Historial de Eventos
        </button>

        {/* Interested Events Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#FF6B00]" />
            <h3 className="text-lg font-extrabold text-white">Mis Próximos Planes</h3>
          </div>

          <div className="space-y-4">
            {interestedEvents.length > 0 ? (
              interestedEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 p-4 rounded-[25px] flex items-center gap-4 hover:border-white/30 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                    <img 
                      src={event.foto_url} 
                      alt={event.titulo} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{event.titulo}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <Calendar size={12} />
                        <span>{new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <MapPin size={12} />
                        <span>Madrid</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/20 rounded-full text-[10px] font-black uppercase">
                    Match
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] text-center">
                <p className="text-gray-400 text-sm">Aún no tienes planes confirmados.</p>
              </div>
            )}
          </div>
        </div>

        {/* Saved Events Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2">
            <Bookmark size={20} className="text-[#FF6B00]" />
            <h3 className="text-lg font-extrabold text-white">Guardados para después</h3>
          </div>

          <div className="space-y-4">
            {savedEventsData.length > 0 ? (
              savedEventsData.map((event) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 p-4 rounded-[25px] flex items-center gap-4 hover:border-white/30 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                    <img 
                      src={event.foto_url} 
                      alt={event.titulo} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{event.titulo}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <Calendar size={12} />
                        <span>{new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <MapPin size={12} />
                        <span>Madrid</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/')}
                    className="p-2 text-[#FF6B00] hover:bg-[#FF6B00]/10 rounded-full transition-colors"
                  >
                    <ChevronLeft className="rotate-180" size={20} />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="bg-white/5 border border-white/10 p-8 rounded-[30px] text-center">
                <p className="text-gray-400 text-sm">No tienes eventos guardados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
