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
    <div className="flex-1 flex flex-col pt-8 bg-transparent min-h-screen relative z-10 w-full max-w-md mx-auto px-4">
      <AnimatePresence mode="wait">
        {!analysisResult ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="mt-8 mb-8">
              <h1 className="font-headline text-5xl font-black italic tracking-tighter text-on-surface leading-tight mb-3">ADN Digital</h1>
              <p className="text-on-surface-variant font-medium">Conectamos con tu presencia digital para curar tu experiencia Reel2Real.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-primary uppercase tracking-widest ml-4">Instagram</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary">
                    <Instagram size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="@usuario"
                    value={handles.instagram}
                    onChange={(e) => setHandles({ ...handles, instagram: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-surface-container-lowest border-2 border-outline-variant wobbly-border focus:border-primary focus:ring-0 outline-none transition-all text-on-surface font-medium placeholder:text-outline-variant/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-primary uppercase tracking-widest ml-4">Twitter / X</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary">
                    <Twitter size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="@usuario"
                    value={handles.twitter}
                    onChange={(e) => setHandles({ ...handles, twitter: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-surface-container-lowest border-2 border-outline-variant wobbly-border focus:border-primary focus:ring-0 outline-none transition-all text-on-surface font-medium placeholder:text-outline-variant/60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-primary uppercase tracking-widest ml-4">LinkedIn</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary">
                    <Linkedin size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="url-perfil"
                    value={handles.linkedin}
                    onChange={(e) => setHandles({ ...handles, linkedin: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-surface-container-lowest border-2 border-outline-variant wobbly-border focus:border-primary focus:ring-0 outline-none transition-all text-on-surface font-medium placeholder:text-outline-variant/60"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pb-8 space-y-4">
              <button 
                disabled={isAnalyzing || (!handles.instagram && !handles.twitter && !handles.linkedin)}
                onClick={handleAnalyze}
                className={cn(
                  "w-full py-5 rounded-xl font-headline font-bold text-lg transition-all flex items-center justify-center gap-3 wobbly-border",
                  isAnalyzing || (!handles.instagram && !handles.twitter && !handles.linkedin)
                    ? "bg-surface-container text-on-surface-variant/50 cursor-not-allowed"
                    : "bg-primary text-on-primary shadow-[4px_4px_0px_#450051] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analizando perfil...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Curar Mi Experiencia
                  </>
                )}
              </button>
              <button 
                onClick={() => onComplete({ intereses: [], hashtags: [], handles: {} })}
                className="w-full py-3 mt-4 font-headline text-base font-bold text-tertiary bg-transparent border-2 border-tertiary wobbly-border transition-all hover:bg-tertiary/5 relative group"
              >
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0 group-hover:w-16 h-[2px] bg-tertiary transition-all duration-300"></div>
                Omitir por ahora
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="mt-8 mb-8">
              <div className="w-16 h-16 bg-primary rounded-2xl wobbly-border flex items-center justify-center mb-6 shadow-[4px_4px_0px_#ea73fb]">
                <CheckCircle2 className="text-on-primary" size={32} />
              </div>
              <h1 className="font-headline text-4xl font-bold text-on-surface mb-2 tracking-tight">Análisis Completado</h1>
              <p className="text-on-surface-variant font-medium">Gemini ha identificado tu esencia digital.</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-label text-xs font-bold text-primary uppercase tracking-widest">Intereses Detectados</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.intereses.map((item, i) => (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className="px-4 py-2 bg-primary/10 text-primary border-2 border-primary rounded-full text-sm font-bold shadow-[2px_2px_0px_#ea73fb] translate-y-[-1px] translate-x-[-1px]"
                    >
                      {item}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-label text-xs font-bold text-primary uppercase tracking-widest">Hashtags Clave</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.hashtags.map((tag, i) => (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      key={i} 
                      className="px-4 py-2 bg-surface-container-lowest text-on-surface-variant border-2 border-outline-variant rounded-full text-sm font-bold"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pb-8">
              <button 
                onClick={() => onComplete({ ...analysisResult, handles })}
                className="w-full py-5 rounded-xl font-headline font-bold text-lg transition-all flex items-center justify-center gap-2 bg-primary text-on-primary shadow-[4px_4px_0px_#450051] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none wobbly-border"
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
