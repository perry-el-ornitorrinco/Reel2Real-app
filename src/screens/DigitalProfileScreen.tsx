import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Sparkles, ChevronRight, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { analyzeDigitalProfile } from '../services/aiRecommendationEngine';
import { cn } from '../lib/utils';

interface DigitalProfileScreenProps {
  onComplete: (data: { intereses: string[]; hashtags: string[]; handles?: { instagram?: string; twitter?: string; linkedin?: string } }) => void;
}

export const DigitalProfileScreen: React.FC<DigitalProfileScreenProps> = ({ onComplete }) => {
  const [handles, setHandles] = useState({ instagram: '', twitter: '', linkedin: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ intereses: string[]; hashtags: string[] } | null>(null);

  const handleAnalyze = async () => {
    if (!handles.instagram && !handles.twitter && !handles.linkedin) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeDigitalProfile(handles);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing profile:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-white min-h-screen">
      <AnimatePresence mode="wait">
        {!analysisResult ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="mt-12 mb-12">
              <div className="w-16 h-16 bg-blue-500 rounded-[22px] flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                <Sparkles className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">ADN Digital</h1>
              <p className="text-gray-500 text-lg">Conectamos con tu presencia digital para curar tu experiencia Zenith.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Instagram</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Instagram size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="@usuario"
                    value={handles.instagram}
                    onChange={(e) => setHandles({ ...handles, instagram: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[25px] border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Twitter / X</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Twitter size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="@usuario"
                    value={handles.twitter}
                    onChange={(e) => setHandles({ ...handles, twitter: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[25px] border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">LinkedIn</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Linkedin size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="url-perfil"
                    value={handles.linkedin}
                    onChange={(e) => setHandles({ ...handles, linkedin: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-gray-50 rounded-[25px] border-none focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-auto pb-8">
              <button 
                disabled={isAnalyzing || (!handles.instagram && !handles.twitter && !handles.linkedin)}
                onClick={handleAnalyze}
                className={cn(
                  "w-full py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl",
                  isAnalyzing || (!handles.instagram && !handles.twitter && !handles.linkedin)
                    ? "bg-gray-100 text-gray-400"
                    : "bg-gray-900 text-white hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Analizar Perfil
                  </>
                )}
              </button>
              <button 
                onClick={() => onComplete({ intereses: [], hashtags: [], handles: {} })}
                className="w-full py-4 text-gray-400 text-sm font-medium mt-2"
              >
                Omitir por ahora
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col"
          >
            <div className="mt-12 mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-[22px] flex items-center justify-center mb-6 shadow-xl shadow-green-500/20">
                <CheckCircle2 className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">Análisis Completado</h1>
              <p className="text-gray-500 text-lg">Gemini ha identificado tu esencia digital.</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Intereses Detectados</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.intereses.map((item, i) => (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold"
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hashtags Clave</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.hashtags.map((tag, i) => (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      key={i} 
                      className="px-4 py-2 bg-gray-50 text-gray-500 rounded-full text-sm font-medium border border-gray-100"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pb-8">
              <button 
                onClick={() => onComplete({ ...analysisResult, handles })}
                className="w-full py-5 bg-gray-900 text-white rounded-full font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Confirmar y Continuar
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
