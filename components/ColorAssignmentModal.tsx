import React, { useState, useEffect } from 'react';
import { soundManager } from '../services/soundManager.ts';
import { COLOR_HEX } from '../constants.ts';

interface ColorAssignmentModalProps {
  isOpen: boolean;
  assignedColor: string;
  playerName: string;
  gameMode: 'blitz' | '1v1' | 'tournament';
  onConfirm: () => void;
}

const ColorAssignmentModal: React.FC<ColorAssignmentModalProps> = ({
  isOpen,
  assignedColor,
  playerName,
  gameMode,
  onConfirm
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      soundManager.play('click');
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const colorHex = COLOR_HEX[assignedColor as keyof typeof COLOR_HEX] || '#00ffff';

  const modeConfig = {
    blitz: { name: 'BLITZ', description: 'WAITING FOR PLAYERS...' },
    '1v1': { name: '1v1 DUEL', description: 'COLOR LOCKED' },
    tournament: { name: 'GRAND PRIX', description: 'COLOR LOCKED' }
  };

  const config = modeConfig[gameMode];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-lg p-3 sm:p-4">
      <div className="bg-vegas-panel/95 border border-white/20 p-4 sm:p-6 md:p-8 rounded-lg w-full max-w-md relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50"></div>
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-sm sm:text-base md:text-lg font-arcade text-slate-500 uppercase tracking-widest mb-3">
            {config.name}
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-arcade text-white mb-4 tracking-widest uppercase">
            Your Color Assignment
          </h2>
        </div>

        {/* Color Display */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div
            className={`relative transition-all duration-500 ${
              isAnimating ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
            }`}
            style={{
              boxShadow: `0 0 60px ${colorHex}99, inset 0 0 30px ${colorHex}44`
            }}
          >
            <div
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 border-4 rounded-full flex items-center justify-center text-5xl sm:text-6xl md:text-7xl font-arcade font-black"
              style={{
                borderColor: colorHex,
                backgroundColor: `${colorHex}15`,
                color: colorHex
              }}
            >
              {assignedColor.charAt(0).toUpperCase()}
            </div>

            {/* Glow Rings */}
            <div
              className="absolute inset-0 rounded-full border-2 animate-pulse"
              style={{ borderColor: colorHex, opacity: 0.3 }}
            />
            <div
              className="absolute -inset-4 rounded-full border-2 animate-pulse"
              style={{
                borderColor: colorHex,
                opacity: 0.15,
                animationDelay: '0.2s'
              }}
            />
          </div>
        </div>

        {/* Color Name */}
        <div className="text-center mb-2">
          <div className="text-2xl sm:text-3xl md:text-4xl font-arcade font-black uppercase tracking-wider mb-1" style={{ color: colorHex }}>
            {assignedColor}
          </div>
          <div className="text-xs sm:text-sm font-mono text-slate-500">{colorHex}</div>
        </div>

        {/* Info Box */}
        <div className="bg-black/40 border border-white/10 rounded-sm p-3 sm:p-4 mb-6 sm:mb-8 mt-6 sm:mt-8">
          <div className="text-slate-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            Game Status
          </div>
          <div className="text-slate-300 text-[10px] sm:text-xs font-mono leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 bg-neon-purple rounded-full animate-pulse"></span>
              {config.description}
            </div>
            <div className="text-slate-500 text-[9px] mt-2">
              You are assigned the <span className="font-bold uppercase" style={{ color: colorHex }}>{assignedColor}</span> color. This is your winning color on the wheel.
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            soundManager.play('lock');
            onConfirm();
          }}
          className="w-full py-3 sm:py-4 bg-neon-cyan text-black font-arcade hover:bg-neon-cyan/80 transition-colors uppercase text-[9px] sm:text-xs tracking-widest rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.4)] font-black"
        >
          ENTER GAME ROOM
        </button>

        {/* Footer Info */}
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-slate-500 text-[8px] sm:text-[9px] font-mono uppercase tracking-wider">
            All players must place bets to proceed
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColorAssignmentModal;
