import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building2, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { signInWithGoogle, db, auth } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { DigitalProfileScreen } from './DigitalProfileScreen';

const AVAILABLE_TAGS = [
  "#Gaming", "#Vegan", "#Tardeo", "#Deporte", "#Cultura", 
  "#Tech", "#Música", "#Arte", "#Networking", "#Yoga",
  "#Café", "#Lectura", "#Outdoor", "#Moda", "#Gastro"
];

const BUSINESS_CATEGORIES = [
  "Gastro", "Tech", "Arte", "Bienestar", "Música", "Gaming", "Deporte", "Cultura", "Networking"
];

export const AuthScreen: React.FC<{ onAuthComplete: () => void }> = ({ onAuthComplete }) => {
  const [step, setStep] = useState<'role' | 'digital_profile' | 'onboarding' | 'business'>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [digitalHandles, setDigitalHandles] = useState<{ instagram?: string; twitter?: string; linkedin?: string }>({});
  const [businessData, setBusinessData] = useState({ nombre: '', cif: '', categoria: '' });
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (selectedRole: UserRole) => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      setRole(selectedRole);
      if (selectedRole === 'user') {
        setStep('digital_profile');
      } else {
        setStep('business');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDigitalProfileComplete = (data: { intereses: string[]; hashtags: string[]; handles?: any }) => {
    if (data.intereses.length > 0) {
      setSelectedTags(data.intereses);
      setHashtags(data.hashtags);
      if (data.handles) setDigitalHandles(data.handles);
      setStep('onboarding');
    } else {
      setStep('onboarding');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const completeOnboarding = async () => {
    if (selectedTags.length < 5 || !auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        role: 'user',
        intereses: selectedTags,
        hashtags_redes: hashtags.length > 0 ? hashtags : selectedTags.map(t => t.toLowerCase()),
        digitalHandles,
        ubicacion: { lat: 40.4168, lng: -3.7038 },
        timeSpentToday: 0,
        createdAt: serverTimestamp()
      });
      onAuthComplete();
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeBusinessRegistration = async () => {
    if (!businessData.nombre || !businessData.cif || !auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        role: 'business',
        businessInfo: {
          nombreEstablecimiento: businessData.nombre,
          cif: businessData.cif,
          categoria: businessData.categoria
        },
        intereses: [],
        hashtags_redes: [],
        ubicacion: { lat: 40.4168, lng: -3.7038 },
        timeSpentToday: 0,
        createdAt: serverTimestamp()
      });
      onAuthComplete();
    } catch (error) {
      console.error("Error saving business:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary-container relative">
      <div className="fixed inset-0 paper-grain z-50"></div>
      
      <AnimatePresence mode="wait">
        {step === 'role' && (
          <motion.main 
            key="role"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative min-h-screen flex flex-col items-center justify-between px-8 py-16 overflow-hidden w-full"
          >
            {/* Whimsical Doodles & Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Heart Doodle */}
              <div className="absolute top-[15%] left-[10%] text-primary opacity-30 floating-doodle" style={{ animationDelay: '0.5s' }}>
                <svg width="72" height="72" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              {/* Sparkle Doodle */}
              <div className="absolute bottom-[25%] right-[12%] text-secondary opacity-30 floating-doodle" style={{ animationDelay: '1.2s' }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>
              </div>
              {/* Squiggle SVG 1 */}
              <svg className="absolute top-[5%] right-[5%] w-48 h-48 text-tertiary-container opacity-20 rotate-12" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 180C40 140 80 180 100 120C120 60 160 100 180 20" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></path>
              </svg>
              {/* Squiggle SVG 2 */}
              <svg className="absolute bottom-[10%] left-[-5%] w-64 h-64 text-primary-container opacity-20 -rotate-12" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 100C40 80 60 140 100 120C140 100 160 160 190 140" stroke="currentColor" strokeLinecap="round" strokeWidth="12"></path>
              </svg>
              {/* Circle Accent */}
              <div className="absolute top-[40%] right-[-10%] w-72 h-72 bg-secondary-container/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[5%] left-[20%] w-48 h-48 bg-tertiary-container/20 rounded-full blur-2xl"></div>
            </div>

            {/* Top Content */}
            <div className="relative z-10 w-full max-w-md text-center mt-8">
              <div className="mb-4 inline-block transform -rotate-2 bg-surface-container-high px-4 py-1 rounded-lg">
                <span className="font-label text-xs font-bold tracking-widest text-primary uppercase">Community First</span>
              </div>
              <h1 className="font-headline text-5xl md:text-6xl font-black italic tracking-tighter text-on-surface leading-tight">
                Welcome to the<br/>
                <span className="text-primary decoration-secondary-container decoration-4 underline-offset-8 underline">Real World</span>
              </h1>
            </div>

            {/* Center Logo Section */}
            <div className="relative z-10 flex flex-col items-center mt-12 w-full max-w-sm">
              <div className="relative w-full">
                {/* Decorative Frame for Logo */}
                <div className="absolute -inset-4 bg-primary/10 sketchy-shape transform rotate-3"></div>
                <div className="absolute -inset-2 bg-secondary/10 sketchy-shape transform -rotate-3"></div>
                <div className="relative bg-surface-container-lowest p-8 wobbly-border shadow-[8px_8px_0px_#ea73fb] border-2 border-primary flex flex-col items-center text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-black italic tracking-tighter text-purple-800">Reel2Real</span>
                    <div className="mt-2 flex gap-1 text-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </div>
                  </div>

                  {/* Actions injected into card for UX */}
                  <div className="mt-8 space-y-3 w-full">
                    <button 
                      onClick={() => handleGoogleLogin('user')}
                      className="group relative w-full py-4 font-headline text-lg font-bold text-on-primary bg-primary wobbly-border shadow-[4px_4px_0px_#450051] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
                    >
                      <span className="relative z-10 flex items-center gap-2"><User size={20} /> Entrar como Usuario</span>
                      <div className="absolute inset-0 bg-primary-dim opacity-0 group-hover:opacity-100 transition-opacity wobbly-border"></div>
                    </button>
                    
                    <button 
                      onClick={() => handleGoogleLogin('business')}
                      className="group relative w-full py-3 font-headline text-base font-bold text-primary bg-transparent border-2 border-primary wobbly-border transition-all hover:bg-primary/5 flex items-center justify-center gap-2"
                    >
                      <span>Empresas y Creadores</span>
                    </button>
                  </div>

                </div>
              </div>
              <p className="mt-12 max-w-[280px] text-center font-body text-on-surface-variant leading-relaxed font-medium">
                Ditch the filters. Embrace the mess. Share the moments that actually matter.
              </p>
            </div>

            {/* Bottom Footer Area */}
            <div className="relative z-10 w-full max-w-xs mt-6">
              <p className="text-center text-xs font-semibold text-on-surface-variant/60 tracking-wide flex items-center justify-center gap-2">
                JOIN 50K+ CURATORS 
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.18 11.5 10.38 7.6 13.8 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z"/></svg>
              </p>
            </div>

            {/* Illustration Overlay */}
            <div className="absolute top-[20%] left-[50%] -translate-x-1/2 opacity-10 pointer-events-none">
              <img 
                className="w-96 h-96 object-contain mix-blend-multiply" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOrdjwn0uR-vQCoQXJXVW8ILzNZXue52t1yZ6mv2gRkvryHsXtD0igHx2AAXx0A85bBIorQOOHDPDTox5dbEVTXQdQtJsQatbun4y3jw3Blg0m-qoERKL5pFS7R6tqPExOypazp-VMYAIj5MHGx0agsWfj2D141AjMr_z-69mZNeNU1tSglZFN9METpJTpCJUJ8JAXnfNmdQaQeJe5ZyA1q0yHXZOrl2iEIwuHMGxNa3W2sZsmFkuXbdGF41PgEaQeux-n4HKDCyB1" 
                alt=""
              />
            </div>
          </motion.main>
        )}

        {step === 'digital_profile' && (
          <DigitalProfileScreen onComplete={handleDigitalProfileComplete} />
        )}

        {step === 'onboarding' && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 flex-1 flex flex-col w-full max-w-md mx-auto justify-center px-4"
          >
            <div className="mt-12 mb-8">
              <h2 className="font-headline text-4xl font-bold text-on-surface mb-2 tracking-tight">Tus Pasiones</h2>
              <p className="text-on-surface-variant font-medium">Elige al menos <span className="text-primary font-bold">5 tags</span> para personalizar tu experiencia.</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-12">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <motion.button
                    key={tag}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-6 py-3 rounded-full text-sm font-bold transition-all border-2",
                      isSelected 
                        ? "bg-primary border-primary text-on-primary shadow-[4px_4px_0px_#ea73fb] translate-y-[-2px] translate-x-[-2px]" 
                        : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary hover:bg-surface-container"
                    )}
                  >
                    {tag}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-auto pb-8">
              <button 
                disabled={selectedTags.length < 5 || loading}
                onClick={completeOnboarding}
                className={cn(
                  "w-full py-5 rounded-xl font-headline font-bold text-lg transition-all flex items-center justify-center gap-2",
                  selectedTags.length >= 5 
                    ? "bg-primary text-on-primary shadow-[4px_4px_0px_#450051] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none wobbly-border" 
                    : "bg-surface-container text-on-surface-variant/50 cursor-not-allowed wobbly-border"
                )}
              >
                {loading ? "Guardando..." : "Comenzar Experiencia"}
                {selectedTags.length >= 5 && <ChevronRight size={20} />}
              </button>
              <p className="text-center mt-4 font-label text-xs font-semibold text-on-surface-variant/60 uppercase tracking-widest">
                {selectedTags.length}/5 seleccionados
              </p>
            </div>
          </motion.div>
        )}

        {step === 'business' && (
          <motion.div 
            key="business"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 flex-1 flex flex-col w-full max-w-md mx-auto justify-center px-4"
          >
            <div className="mt-12 mb-8">
              <h2 className="font-headline text-4xl font-bold text-on-surface mb-2 tracking-tight">Perfil Empresa</h2>
              <p className="text-on-surface-variant font-medium">Configura tu establecimiento para empezar a publicar.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-primary uppercase tracking-widest ml-2">Nombre del Establecimiento</label>
                <input 
                  type="text" 
                  value={businessData.nombre}
                  onChange={(e) => setBusinessData({...businessData, nombre: e.target.value})}
                  className="w-full p-5 bg-surface-container-lowest border-2 border-outline-variant wobbly-border focus:border-primary focus:ring-0 outline-none transition-all text-on-surface font-medium"
                  placeholder="Ej: La Central de Callao"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-primary uppercase tracking-widest ml-2">CIF / ID Fiscal</label>
                <input 
                  type="text" 
                  value={businessData.cif}
                  onChange={(e) => setBusinessData({...businessData, cif: e.target.value})}
                  className="w-full p-5 bg-surface-container-lowest border-2 border-outline-variant wobbly-border focus:border-primary focus:ring-0 outline-none transition-all text-on-surface font-medium"
                  placeholder="Ej: B12345678"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-primary uppercase tracking-widest ml-2">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_CATEGORIES.map((cat) => {
                    const isSelected = businessData.categoria === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBusinessData({...businessData, categoria: cat})}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold transition-all border-2",
                          isSelected 
                            ? "bg-primary border-primary text-on-primary shadow-[2px_2px_0px_#ea73fb] translate-y-[-1px] translate-x-[-1px]" 
                            : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary hover:bg-surface-container"
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 pb-8">
              <button 
                disabled={!businessData.nombre || !businessData.cif || loading}
                onClick={completeBusinessRegistration}
                className={cn(
                  "w-full py-5 rounded-xl font-headline font-bold text-lg transition-all flex items-center justify-center gap-2",
                  businessData.nombre && businessData.cif
                    ? "bg-primary text-on-primary shadow-[4px_4px_0px_#450051] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none wobbly-border" 
                    : "bg-surface-container text-on-surface-variant/50 cursor-not-allowed wobbly-border"
                )}
              >
                {loading ? "Registrando..." : "Crear Perfil Empresa"}
                <CheckCircle2 size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
