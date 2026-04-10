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
    <div className="min-h-screen bg-white flex flex-col p-8">
      <AnimatePresence mode="wait">
        {step === 'role' && (
          <motion.div 
            key="role"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="mb-12">
              <div className="w-16 h-16 bg-blue-500 rounded-[22px] flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                <Sparkles className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Bienvenido a Zenith</h1>
              <p className="text-gray-500 text-lg">Selecciona tu perfil para comenzar.</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleGoogleLogin('user')}
                className="w-full group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[25px] shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Soy Usuario</h3>
                    <p className="text-sm text-gray-400">Buscar planes y eventos</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500" />
              </button>

              <button 
                onClick={() => handleGoogleLogin('business')}
                className="w-full group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[25px] shadow-sm hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 text-gray-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Soy Empresa</h3>
                    <p className="text-sm text-gray-400">Crear y gestionar eventos</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-blue-500" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'digital_profile' && (
          <DigitalProfileScreen onComplete={handleDigitalProfileComplete} />
        )}

        {step === 'onboarding' && (
          <motion.div 
            key="onboarding"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col"
          >
            <div className="mt-12 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Tus Pasiones</h2>
              <p className="text-gray-500">Elige al menos <span className="text-blue-500 font-bold">5 tags</span> para personalizar tu experiencia.</p>
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
                      "px-6 py-3 rounded-full text-sm font-medium transition-all border",
                      isSelected 
                        ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30" 
                        : "bg-white border-gray-100 text-gray-500 hover:border-blue-200"
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
                  "w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2",
                  selectedTags.length >= 5 
                    ? "bg-gray-900 text-white shadow-xl" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {loading ? "Guardando..." : "Comenzar Experiencia"}
                {selectedTags.length >= 5 && <ChevronRight size={20} />}
              </button>
              <p className="text-center mt-4 text-xs text-gray-400">
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
            className="flex-1 flex flex-col"
          >
            <div className="mt-12 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Perfil Empresa</h2>
              <p className="text-gray-500">Configura tu establecimiento para empezar a publicar.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Nombre del Establecimiento</label>
                <input 
                  type="text" 
                  value={businessData.nombre}
                  onChange={(e) => setBusinessData({...businessData, nombre: e.target.value})}
                  className="w-full p-5 bg-gray-50 rounded-[20px] border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Ej: Zenith Coffee & Co"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">CIF / ID Fiscal</label>
                <input 
                  type="text" 
                  value={businessData.cif}
                  onChange={(e) => setBusinessData({...businessData, cif: e.target.value})}
                  className="w-full p-5 bg-gray-50 rounded-[20px] border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Ej: B12345678"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_CATEGORIES.map((cat) => {
                    const isSelected = businessData.categoria === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBusinessData({...businessData, categoria: cat})}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          isSelected 
                            ? "bg-blue-500 border-blue-500 text-white shadow-md" 
                            : "bg-gray-50 border-transparent text-gray-500 hover:border-blue-200"
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-auto pb-8">
              <button 
                disabled={!businessData.nombre || !businessData.cif || loading}
                onClick={completeBusinessRegistration}
                className={cn(
                  "w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2",
                  businessData.nombre && businessData.cif
                    ? "bg-gray-900 text-white shadow-xl" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
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
