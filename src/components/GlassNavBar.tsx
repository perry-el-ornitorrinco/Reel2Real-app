import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, BarChart3, MessageCircle, User, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface GlassNavBarProps {
  userRole: UserRole;
}

export const GlassNavBar: React.FC<GlassNavBarProps> = ({ userRole }) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 md:px-8 pb-8 pt-4 bg-surface-container-lowest/80 backdrop-blur-xl border-t-2 border-dashed border-primary/20 pb-safe">
      {userRole === 'user' && (
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-3 transition-all duration-300 wobbly-border",
              isActive 
                ? "bg-primary-container text-on-primary rounded-[2rem_1.5rem_2.2rem_1rem] shadow-[4px_4px_0_0_#9720ab] -rotate-3 scale-110" 
                : "text-on-surface opacity-60 hover:scale-110 hover:-rotate-3 hover:opacity-100"
            )
          }
        >
          <Compass size={28} strokeWidth={2} />
        </NavLink>
      )}

      {userRole === 'business' && (
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-3 transition-all duration-300 wobbly-border",
              isActive 
                ? "bg-primary-container text-on-primary rounded-[1.5rem_2rem_1rem_2.2rem] shadow-[4px_4px_0_0_#9720ab] rotate-3 scale-110" 
                : "text-on-surface opacity-60 hover:scale-110 hover:-rotate-3 hover:opacity-100"
            )
          }
        >
          <BarChart3 size={28} strokeWidth={2} />
        </NavLink>
      )}
      
      {userRole === 'user' && (
        <NavLink
          to="/saved"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-3 transition-all duration-300 wobbly-border",
              isActive 
                ? "bg-primary-container text-on-primary rounded-[1.5rem_2rem_1rem_2.2rem] shadow-[4px_4px_0_0_#9720ab] rotate-3 scale-110" 
                : "text-on-surface opacity-60 hover:scale-110 hover:-rotate-3 hover:opacity-100"
            )
          }
        >
          <Bookmark size={28} strokeWidth={2} />
        </NavLink>
      )}
      
      <NavLink
        to="/matches"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center p-3 transition-all duration-300 wobbly-border",
            isActive 
              ? "bg-primary-container text-on-primary rounded-[2.2rem_1rem_2rem_1.5rem] shadow-[4px_4px_0_0_#9720ab] -rotate-3 scale-110" 
              : "text-on-surface opacity-60 hover:scale-110 hover:-rotate-3 hover:opacity-100"
          )
        }
      >
        <MessageCircle size={28} strokeWidth={2} />
      </NavLink>
      
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center p-3 transition-all duration-300 wobbly-border",
            isActive 
              ? "text-[#FF6B00] bg-transparent shadow-none scale-125 border-b-2 border-dashed border-[#FF6B00] rotate-3" 
              : "text-on-surface opacity-60 hover:scale-110 hover:-rotate-3 hover:opacity-100"
          )
        }
      >
        <User size={28} strokeWidth={2} />
      </NavLink>
    </nav>
  );
};
