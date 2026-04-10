import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MapPin, Users, Info, Bookmark } from 'lucide-react';
import { Event } from '../types';
import { cn } from '../lib/utils';

interface SwipeCardProps {
  event: Event;
  onSwipe: (direction: 'left' | 'right') => void;
  onSave?: (eventId: string) => void;
  onClick?: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ event, onSwipe, onSave, onClick }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // Visual feedback transforms
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);
  const overlayBg = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(239, 68, 68, 0.1)", "rgba(255, 255, 255, 0)", "rgba(34, 197, 94, 0.1)"]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="absolute w-full max-w-sm h-[500px] bg-white rounded-[25px] shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-black/5"
    >
      {/* Directional Overlays */}
      <motion.div 
        style={{ backgroundColor: overlayBg }}
        className="absolute inset-0 z-10 pointer-events-none transition-colors duration-200"
      />

      <motion.div 
        style={{ opacity: likeOpacity }}
        className="absolute top-10 left-10 z-20 border-4 border-green-500 rounded-xl px-4 py-2 -rotate-12 pointer-events-none"
      >
        <span className="text-green-500 text-4xl font-black tracking-widest uppercase">LIKE</span>
      </motion.div>

      <motion.div 
        style={{ opacity: nopeOpacity }}
        className="absolute top-10 right-10 z-20 border-4 border-red-500 rounded-xl px-4 py-2 rotate-12 pointer-events-none"
      >
        <span className="text-red-500 text-4xl font-black tracking-widest uppercase">NOPE</span>
      </motion.div>

      <div className="relative h-2/3">
        <img
          src={event.foto_url}
          alt={event.titulo}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {event.isPremium && (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            PREMIUM
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white">
          <h3 className="text-2xl font-bold">{event.titulo}</h3>
          <div className="flex items-center gap-2 text-sm mt-1 opacity-90">
            <MapPin size={14} />
            <span>{event.categoria}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col justify-between h-1/3">
        <p className="text-gray-600 text-sm line-clamp-2">{event.descripcion}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Users size={14} />
            <span>{event.asistentes_actuales.length} / {event.aforo_max}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSave?.(event.id);
              }}
              className="p-2 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
              title="Guardar para después"
            >
              <Bookmark size={20} />
            </button>
            <button className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
              <Info size={20} className="text-blue-500" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
