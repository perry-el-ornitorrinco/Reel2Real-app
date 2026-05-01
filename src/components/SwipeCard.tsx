import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, useAnimation } from 'framer-motion';
import { MapPin, Users, Info, Bookmark, Flame } from 'lucide-react';
import { Event } from '../types';
import { cn } from '../lib/utils';

interface SwipeCardProps {
  event: Event;
  onSwipe: (direction: 'left' | 'right') => void;
  onSave?: (eventId: string) => void;
  onClick?: () => void;
  isActive?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ event, onSwipe, onSave, onClick, isActive = true }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  // Mapped transforms according to specs
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 1, 1, 1, 0]);
  
  // Visual feedback transforms
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);
  // Teñir de naranja en el click / swipe
  const overlayBg = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(128, 128, 128, 0.4)", "rgba(0, 0, 0, 0)", "rgba(255, 107, 0, 0.4)"]
  );

  const handleDragEnd = async (_: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    const velocityThreshold = 500;
    
    const isRightSwipe = info.offset.x > threshold || info.velocity.x > velocityThreshold;
    const isLeftSwipe = info.offset.x < -threshold || info.velocity.x < -velocityThreshold;

    if (isRightSwipe) {
      await controls.start({ x: window.innerWidth, transition: { type: 'spring', damping: 20, stiffness: 300 } });
      onSwipe('right');
    } else if (isLeftSwipe) {
      await controls.start({ x: -window.innerWidth, transition: { type: 'spring', damping: 20, stiffness: 300 } });
      onSwipe('left');
    } else {
      // Snap back if threshold not met
      controls.start({ x: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, willChange: 'transform' }}
      animate={controls}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      whileDrag={{ scale: 1.05 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={cn(
        "absolute w-full h-[550px] sm:max-w-sm bg-surface-container-lowest shadow-2xl overflow-hidden border-2 wobbly-card border-primary-container",
        isActive ? "cursor-grab active:cursor-grabbing pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Directional Overlays */}
      <motion.div 
        style={{ backgroundColor: overlayBg }}
        className="absolute inset-0 z-10 pointer-events-none transition-colors duration-200"
      />

      <motion.div 
        style={{ opacity: likeOpacity }}
        className="absolute top-12 left-8 z-20 border-4 border-primary rounded-2xl px-6 py-2 -rotate-12 pointer-events-none bg-black/40 backdrop-blur-md"
      >
        <span className="text-primary text-4xl font-extrabold tracking-tight uppercase font-headline">VAMOS</span>
      </motion.div>

      <motion.div 
        style={{ opacity: nopeOpacity }}
        className="absolute top-12 right-8 z-20 border-4 border-error rounded-2xl px-6 py-2 rotate-12 pointer-events-none bg-black/40 backdrop-blur-md"
      >
        <span className="text-error text-4xl font-extrabold tracking-tight uppercase font-headline">PASO</span>
      </motion.div>

      <div className="relative w-full h-full">
        {(!isDragging || isActive) && (
          <img
            src={event.foto_url}
            alt={event.titulo}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            draggable="false"
          />
        )}
        
        {/* Top Badges */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/20 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-primary"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            <span className="text-on-surface font-bold text-xs uppercase tracking-tighter">Realness Verified</span>
          </div>
        </div>

        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-primary text-white border-2 border-primary-container px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#89089e]">
            {event.categoria.toUpperCase()}
          </div>
        </div>
        
        {/* Decorative Doodle */}
        <div className="absolute -top-6 -left-6 opacity-30 pointer-events-none z-30 transition-transform duration-300 group-hover:rotate-12">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="1.5">
             <path d="M12 19l7-7 3 3-7 7-3-3z"/>
             <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
             <path d="M2 2l7.586 7.586"/>
             <circle cx="11" cy="11" r="2"/>
          </svg>
        </div>

        {/* Bottom Content Area with dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 pt-32 flex flex-col justify-end z-10 pointer-events-none">
          <h3 className="text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight font-headline">{event.titulo}</h3>
          
          <div className="flex items-center gap-2 text-primary-fixed mb-3">
             <MapPin size={16} />
             <span className="font-label text-sm font-semibold tracking-wide uppercase">A 5 min</span>
          </div>

          <p className="text-surface-container-lowest/90 text-sm line-clamp-3 leading-relaxed mb-4 font-label">{event.descripcion}</p>
          
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-4 text-gray-200 text-sm font-medium pointer-events-none">
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span>{event.asistentes_actuales.length} apuntados</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.(event.id);
                }}
                className="w-12 h-12 bg-surface-container-lowest/80 backdrop-blur-md rounded-[1.2rem_0.8rem_1rem_0.9rem] flex items-center justify-center hover:-rotate-6 transition-all text-on-surface shadow-[4px_4px_0_0_#9720ab] border-2 border-primary/20 pointer-events-auto active:scale-95 active:shadow-[1px_1px_0_0_#9720ab] active:translate-y-[3px] active:translate-x-[3px]"
                title="Guardar para después"
              >
                <Bookmark size={20} className="text-primary" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="w-12 h-12 bg-primary/90 backdrop-blur-md rounded-[0.8rem_1.2rem_0.9rem_1rem] flex items-center justify-center hover:rotate-6 transition-all text-on-primary shadow-[4px_4px_0_0_#450051] border-2 border-primary pointer-events-auto active:scale-95 active:shadow-[1px_1px_0_0_#450051] active:translate-y-[3px] active:translate-x-[3px]"
                title="Más información"
              >
                <Info size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
