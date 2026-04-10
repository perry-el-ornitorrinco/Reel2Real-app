import React from 'react';
import { MessageSquare, Heart, Clock } from 'lucide-react';

export const MatchChat: React.FC = () => {
  const matches = [
    { id: 1, name: 'Alex Rivera', event: 'Tech Meetup', time: '2m ago', image: 'https://i.pravatar.cc/150?u=alex' },
    { id: 2, name: 'Elena Sanz', event: 'Art Gallery', time: '1h ago', image: 'https://i.pravatar.cc/150?u=elena' },
    { id: 3, name: 'Marc Costa', event: 'Jazz Night', time: '3h ago', image: 'https://i.pravatar.cc/150?u=marc' },
  ];

  return (
    <div className="min-h-screen bg-white p-6 pb-32">
      <header className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Matches</h2>
        <p className="text-gray-400 text-sm mt-1">Conecta con otros asistentes</p>
      </header>

      <div className="space-y-8">
        <section>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            <Heart size={12} className="text-red-500" />
            <span>Nuevos Matches</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {matches.map((match) => (
              <div key={match.id} className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full p-1 border-2 border-blue-500">
                  <img src={match.image} alt={match.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="text-xs font-bold text-gray-900">{match.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            <MessageSquare size={12} className="text-blue-500" />
            <span>Mensajes</span>
          </div>
          <div className="space-y-6">
            {matches.map((match) => (
              <div key={match.id} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100">
                  <img src={match.image} alt={match.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 border-b border-gray-50 pb-4 group-last:border-none">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-gray-900">{match.name}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={10} />
                      <span>{match.time}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">¿Vas a ir al evento de {match.event}?</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
