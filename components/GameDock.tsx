import React, { useState } from 'react';
import { GameSession } from '../types.ts';
import { soundManager } from '../services/soundManager.ts';

interface GameDockProps {
  sessions: GameSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onClose: (sessionId: string) => void;
}

const GameDock: React.FC<GameDockProps> = ({ sessions, activeSessionId, onSelect, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (sessions.length === 0) return null;

  const toggleDock = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHovered(!isHovered);
  };

  return (
    <div 
      className="fixed bottom-16 sm:bottom-4 right-4 md:right-6 z-[150] flex flex-col items-end pointer-events-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
         className="relative w-[240px] md:w-[300px] transition-all duration-300 ease-out" 
         style={{ height: isHovered ? `${sessions.length * 60 + 10}px` : '56px', marginBottom: isHovered ? '8px' : '0' }}
      >
        {sessions.map((session, index) => {
          let textClass = 'text-neon-purple';
          if (session.themeColor === 'neon-green') textClass = 'text-neon-green';
          else if (session.themeColor === 'neon-cyan') textClass = 'text-neon-cyan';
          else if (session.themeColor === 'neon-pink') textClass = 'text-neon-pink';

          const isActive = activeSessionId === session.id;
          const translateY = isHovered 
            ? -(sessions.length - 1 - index) * 60 
            : -(sessions.length - 1 - index) * 4;

          const scale = isHovered ? 1 : 1 - ((sessions.length - 1 - index) * 0.03);
          const opacity = isHovered ? 1 : 1 - ((sessions.length - 1 - index) * 0.15);
          const zIndex = 10 + index;

          return (
            <div
              key={session.id}
              onClick={(e) => { e.stopPropagation(); soundManager.play('click'); onSelect(session.id); }}
              className={`absolute bottom-0 w-full h-14 bg-[#0a0a12] border border-white/10 rounded-md p-3 cursor-pointer transition-all duration-300 flex items-center justify-between shadow-xl pointer-events-auto ${isActive ? 'bg-[#151520] border-white/30' : 'hover:bg-[#151520]'}`}
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
                zIndex: zIndex,
                opacity: opacity,
              }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-1.5 h-1.5 rounded-full ${session.status.includes('SPIN') ? 'animate-ping bg-white' : 'bg-current'} ${textClass}`}></div>
                <div className="flex flex-col min-w-0">
                   <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest ${textClass} truncate`}>
                     {session.type}
                   </span>
                   <span className="text-slate-500 font-mono text-[8px] truncate uppercase">
                     {session.status}
                   </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); soundManager.play('click'); onClose(session.id); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors text-lg"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      
      <div 
        onClick={toggleDock}
        className={`pointer-events-auto cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-black/90 border border-white/10 rounded-lg backdrop-blur shadow-lg transition-all duration-300 ${isHovered ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
        <span className="font-arcade text-[8px] md:text-[10px] text-white tracking-widest uppercase">{sessions.length} ACTIVE</span>
      </div>
    </div>
  );
};

export default GameDock;