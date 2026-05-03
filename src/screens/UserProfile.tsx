import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Shield, Tag, Save, LogOut, ChevronLeft, Calendar, MapPin, Sparkles, History, Instagram, Twitter, Linkedin, Edit3, Clock } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, Event } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { AppMonitorSettings } from '../components/AppMonitorSettings';
import { LocationPicker } from '../components/LocationPicker';

const AVAILABLE_TAGS = [
  "#Gaming", "#Vegan", "#Tardeo", "#Deporte", "#Cultura", 
  "#Tech", "#Música", "#Arte", "#Networking", "#Yoga",
  "#Café", "#Lectura", "#Outdoor", "#Moda", "#Gastro"
];

export default function UserProfile() {
  const [userData, setUserData] = useState<User | null>(null);
  const [interestedEvents, setInterestedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

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
          
          if (userDataObj.ubicacion) {
            setLocation(userDataObj.ubicacion);
          }

          if (userDataObj.digitalHandles) {
            setInstagram(userDataObj.digitalHandles.instagram || '');
            setTwitter(userDataObj.digitalHandles.twitter || '');
            setLinkedin(userDataObj.digitalHandles.linkedin || '');
          }
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
      const digitalHandles = {
        instagram: instagram.trim() || undefined,
        twitter: twitter.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      };

      const updateData: any = {
        intereses: selectedTags,
        hashtags_redes: selectedTags.map(t => t.toLowerCase()),
        digitalHandles
      };
      if (location) {
        updateData.ubicacion = location;
      }

      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      // Update local state
      if (userData) {
        setUserData({ ...userData, ...updateData });
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
      <div className="min-h-screen bg-transparent text-on-surface pb-32 animate-pulse">
        <header className="p-6 flex items-center justify-between sticky top-0 bg-surface/80">
          <div className="w-10 h-10 bg-surface-container rounded-full" />
          <div className="w-32 h-8 bg-surface-container rounded-full" />
          <div className="w-10 h-10 bg-surface-container rounded-full" />
        </header>

        <div className="p-6 space-y-8">
          <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-[2.5rem_1.8rem_3rem_2.2rem] p-8 flex flex-col items-center h-64">
            <div className="w-24 h-24 bg-surface-container rounded-[1.5rem_2rem_1.2rem_1.8rem] mb-4" />
            <div className="w-48 h-8 bg-surface-container rounded-full mb-2" />
            <div className="w-32 h-4 bg-surface-container rounded-full mb-4" />
            <div className="w-40 h-8 bg-surface-container rounded-[1rem_1.2rem_0.8rem_1rem]" />
          </div>

          <div className="bg-tertiary-container/30 border-2 border-tertiary/20 rounded-[1.8rem_2.2rem_1.5rem_2rem] p-6 h-32" />
          
          <div className="bg-surface-container-lowest border-2 border-outline-variant p-6 rounded-[2rem_1.5rem_2.2rem_1rem] h-64" />
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ease: "circOut", duration: 0.3 }}
      className="min-h-screen bg-transparent text-on-surface pb-32"
    >
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-10 border-b-2 border-outline-variant border-dashed">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-primary hover:bg-surface-container rounded-full transition-colors border-2 border-transparent hover:border-outline-variant wobbly-border flex items-center justify-center"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-black font-headline italic text-on-surface tracking-tight">Mi Perfil</h1>
        <button 
          onClick={handleLogout}
          className="p-2 text-error hover:bg-error-container hover:text-on-error-container rounded-full transition-colors font-bold flex items-center justify-center gap-1 group"
        >
          <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </header>

      <div className="p-6 space-y-8">
        {/* User Info Stack */}
        <div className="relative">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-30 text-secondary pointer-events-none rotate-12">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
               <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-[2.5rem_1.8rem_3rem_2.2rem] p-8 flex flex-col items-center text-center shadow-[4px_4px_0_0_#9720ab] wobbly-border relative z-10">
            <div className="w-24 h-24 bg-primary text-on-primary rounded-[1.5rem_2rem_1.2rem_1.8rem] flex items-center justify-center mb-4 shadow-[4px_4px_0_0_#450051] border-2 border-primary rotate-3">
              <UserIcon size={40} />
            </div>
            <h2 className="text-3xl font-black font-headline tracking-tight text-on-surface mb-1">{userData.email.split('@')[0]}</h2>
            <p className="text-on-surface-variant font-label text-sm flex items-center justify-center gap-2 mb-4">
              <Mail size={14} className="text-primary" />
              {userData.email}
            </p>
            
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-secondary-container text-on-secondary-container border-2 border-secondary rounded-[1rem_1.2rem_0.8rem_1rem] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0_0_#5f00a5] -rotate-2 wobbly-border">
                <Shield size={14} />
                {userData.role === 'user' ? 'Nivel de calle: Aprendiz' : 'Organizador'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Snippet */}
        <div className="bg-tertiary-container text-on-tertiary-container border-2 border-tertiary rounded-[1.8rem_2.2rem_1.5rem_2rem] p-6 shadow-[2px_2px_0px_#13587b] wobbly-border rotate-1">
          <h3 className="font-headline font-bold text-lg mb-2 flex items-center gap-2">
            <Clock size={20} className="text-tertiary" />
            Salud Digital
          </h3>
          <p className="font-black text-3xl text-tertiary font-headline leading-tight mt-4">
            Has ahorrado <span className="text-5xl">{userData.timeSpentToday ? Math.round(userData.timeSpentToday / 60) : 0}</span> horas al scroll infinito hoy.
          </p>
        </div>

        {/* Digital Handles */}
        <div className="bg-surface-container-lowest border-2 border-outline-variant p-6 rounded-[2rem_1.5rem_2.2rem_1rem] wobbly-border shadow-[4px_4px_0_0_#5b3f4c]">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 size={20} className="text-secondary" />
            <h3 className="text-xl font-black font-headline text-on-surface tracking-tight">Cuentas Vinculadas</h3>
          </div>
          <p className="font-label text-sm text-on-surface-variant mb-6">Ayuda a la IA a refinar tus planes conectando tus perfiles digitales.</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 text-pink-600 rounded-xl shrink-0 -rotate-3">
                <Instagram size={20} />
              </div>
              <input 
                type="text" 
                placeholder="@usuario" 
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full bg-surface border-2 border-outline-variant rounded-xl px-4 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors font-label placeholder:text-on-surface-variant/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0 rotate-3">
                <Twitter size={20} />
              </div>
              <input 
                type="text" 
                placeholder="@usuario" 
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="w-full bg-surface border-2 border-outline-variant rounded-xl px-4 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors font-label placeholder:text-on-surface-variant/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 text-blue-800 rounded-xl shrink-0 -rotate-2">
                <Linkedin size={20} />
              </div>
              <input 
                type="text" 
                placeholder="@usuario_o_url" 
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="w-full bg-surface border-2 border-outline-variant rounded-xl px-4 py-2 text-on-surface focus:outline-none focus:border-primary transition-colors font-label placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>
        </div>

        {/* App Monitor Settings */}
        <AppMonitorSettings 
          user={userData} 
          onUpdate={(updatedMonitoredApps) => setUserData({ ...userData, monitoredApps: updatedMonitoredApps })}
        />

        {/* Interests Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={20} className="text-secondary" />
              <h3 className="text-xl font-black font-headline text-on-surface tracking-tight">Mis Intereses</h3>
            </div>
            <span className={cn(
              "text-xs font-bold font-label px-3 py-1 rounded-[0.8rem_1rem_1.2rem_0.9rem] border-2 shadow-sm wobbly-border",
              selectedTags.length >= 5 
                ? "bg-tertiary-container text-tertiary border-tertiary" 
                : "bg-surface-container border-outline-variant text-on-surface-variant"
            )}>
              {selectedTags.length}/5 Mínimo
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {AVAILABLE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <motion.button
                  key={tag}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-4 py-2 rounded-[1rem_1.2rem_0.8rem_1rem] text-sm font-bold font-label transition-all border-2 shadow-sm wobbly-border hover:-translate-y-0.5",
                    isSelected 
                      ? "bg-primary text-on-primary border-primary shadow-[2px_2px_0px_#450051] rotate-1" 
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface hover:-rotate-1"
                  )}
                >
                  {tag}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Location Picker */}
        <div className="pt-4">
          <LocationPicker 
            initialLocation={location || undefined} 
            onLocationChange={setLocation} 
          />
        </div>

        {/* Save Button */}
        <button 
          disabled={saving || selectedTags.length < 5}
          onClick={handleSave}
          className={cn(
            "w-full py-4 rounded-[1.2rem_0.8rem_1rem_0.9rem] font-headline font-bold text-lg transition-all flex items-center justify-center gap-3 wobbly-border",
            selectedTags.length >= 5 
              ? "bg-primary text-on-primary shadow-[4px_4px_0_0_#450051] border-2 border-primary hover:scale-[1.02] active:scale-[0.98] active:shadow-[2px_2px_0_0_#450051] active:translate-y-1" 
              : "bg-surface-container-high text-on-surface-variant cursor-not-allowed border-2 border-outline-variant opacity-50"
          )}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={20} />
              Guardar Cambios
            </>
          )}
        </button>

        {/* Interested Events Section */}
        <div className="space-y-6 pt-8 pb-12 border-t-2 border-outline-variant border-dashed">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h3 className="text-xl font-black font-headline text-on-surface tracking-tight">Próximos Planes (Match)</h3>
          </div>

          <div className="space-y-4">
            {interestedEvents.length > 0 ? (
              interestedEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-surface-container-lowest border-2 border-outline-variant p-4 rounded-[1.5rem_1rem_1.2rem_1.8rem] wobbly-border flex items-center gap-4 hover:border-primary transition-all shadow-sm hover:shadow-[2px_2px_0_0_#9720ab] cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-[1rem_0.8rem_1.2rem_0.9rem] overflow-hidden shrink-0 border-2 border-outline-variant wobbly-border">
                    <img 
                      src={event.foto_url} 
                      alt={event.titulo} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold font-headline text-on-surface truncate">{event.titulo}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider font-label">
                        <Calendar size={12} className="text-primary" />
                        <span>{new Date(event.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider font-label">
                        <MapPin size={12} className="text-secondary" />
                        <span>Madrid</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-primary-container text-primary border-2 border-primary rounded-full text-[10px] font-black uppercase rotate-3 shadow-[2px_2px_0_0_#450051] wobbly-border">
                    Match
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-surface-container-lowest border-2 border-outline-variant p-8 rounded-[2rem_1.5rem_2.2rem_1rem] wobbly-border text-center flex flex-col items-center">
                 <div className="w-12 h-12 bg-surface text-on-surface-variant border-2 border-outline-variant rounded-full flex items-center justify-center mb-3">
                   <Calendar size={20} />
                 </div>
                <p className="text-on-surface-variant font-label text-sm">Aún no tienes planes confirmados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
