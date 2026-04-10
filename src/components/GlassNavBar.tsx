import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, BarChart3, MessageCircle, User } from 'lucide-react';
import { cn } from '../lib/utils';

export const GlassNavBar: React.FC = () => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 bg-white/70 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl flex items-center justify-around px-6 z-50">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn(
            "p-2 rounded-full transition-all duration-300",
            isActive ? "bg-blue-500 text-white scale-110 shadow-lg" : "text-gray-400 hover:text-blue-500"
          )
        }
      >
        <Compass size={24} />
      </NavLink>
      
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          cn(
            "p-2 rounded-full transition-all duration-300",
            isActive ? "bg-blue-500 text-white scale-110 shadow-lg" : "text-gray-400 hover:text-blue-500"
          )
        }
      >
        <BarChart3 size={24} />
      </NavLink>
      
      <NavLink
        to="/matches"
        className={({ isActive }) =>
          cn(
            "p-2 rounded-full transition-all duration-300",
            isActive ? "bg-blue-500 text-white scale-110 shadow-lg" : "text-gray-400 hover:text-blue-500"
          )
        }
      >
        <MessageCircle size={24} />
      </NavLink>
      
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          cn(
            "p-2 rounded-full transition-all duration-300",
            isActive ? "bg-blue-500 text-white scale-110 shadow-lg" : "text-gray-400 hover:text-blue-500"
          )
        }
      >
        <User size={24} />
      </NavLink>
    </nav>
  );
};
