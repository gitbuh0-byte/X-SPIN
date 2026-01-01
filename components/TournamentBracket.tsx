import React, { useState, useEffect } from 'react';

interface TournamentBracketProps {
  countdown: number;
  groupNumber: number;
  playersInGroup: number;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ countdown, groupNumber, playersInGroup }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-2 sm:p-3 md:p-4 bg-gradient-to-b from-black/60 to-black overflow-hidden">
      {/* Header */}
      <div className="text-center flex-shrink-0 mb-2 sm:mb-3">
        <div className="text-lg sm:text-2xl md:text-3xl font-arcade text-neon-pink tracking-widest">
          TOURNAMENT GROUPS
        </div>
        <div className="text-[9px] sm:text-xs text-slate-400 font-mono mt-1">
          10 Groups • {playersInGroup} Players Each
        </div>
      </div>

      {/* Stage 1: 10 Groups Grid */}
      <div className="w-full flex-shrink-0 mb-2 sm:mb-3">
        <div className="text-center mb-1.5 sm:mb-2">
          <div className="text-[9px] sm:text-xs text-slate-400 font-arcade tracking-wider uppercase">Stage 1: Group Rounds</div>
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 px-1 sm:px-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((group) => (
            <div
              key={`group-${group}`}
              className={`flex items-center justify-center rounded transition-all duration-300 h-12 sm:h-14 md:h-16 ${
                group === groupNumber
                  ? 'bg-gradient-to-b from-neon-gold/50 to-neon-cyan/50 border border-neon-gold shadow-xl animate-[pulse_1.5s_ease-in-out_infinite]'
                  : 'bg-black/80 border border-slate-700'
              }`}
              style={group === groupNumber ? { boxShadow: '0 0 25px rgba(255,215,0,0.7), inset 0 0 15px rgba(255,215,0,0.2)' } : {}}
            >
              <div className={`text-xs sm:text-sm font-arcade font-bold ${
                group === groupNumber ? 'text-neon-gold' : 'text-slate-400'
              }`}>
                G{group}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Flow - Center */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Arrow Down */}
        <div className="text-neon-green text-lg sm:text-xl animate-bounce">↓</div>

        {/* Stage 2: Winners Selected */}
        <div className="text-center">
          <div className="text-[9px] sm:text-xs text-slate-400 font-arcade tracking-wider uppercase">Stage 2: Winners Selected</div>
          <div className="text-[8px] sm:text-[10px] text-slate-600">10 finalists advance</div>
        </div>

        {/* Arrow Down */}
        <div className="text-neon-green text-lg sm:text-xl animate-bounce">↓</div>

        {/* Stage 3: Grand Final */}
        <div className="text-center">
          <div className="text-[9px] sm:text-xs text-slate-400 font-arcade tracking-wider uppercase">Stage 3: Grand Final</div>
          <div className="bg-gradient-to-b from-neon-gold/30 to-neon-yellow/10 border border-neon-gold rounded px-2 sm:px-3 py-1">
            <div className="text-[9px] sm:text-xs font-arcade text-neon-gold font-bold">1 CHAMPION</div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="text-neon-gold text-lg sm:text-xl animate-bounce">↓</div>

        {/* Trophy */}
        <div className="text-center">
          <div className="text-3xl sm:text-4xl md:text-5xl" style={{ 
            textShadow: '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,215,0,0.4)'
          }}>
            🏆
          </div>
          <div className="text-[8px] sm:text-[10px] font-arcade text-neon-gold font-bold tracking-wider" style={{
            textShadow: '0 0 15px rgba(255,215,0,0.6)'
          }}>
            GRAND PRIZE
          </div>
        </div>
      </div>

      {/* Countdown - Floating on top with glow animation */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-center">
          <style>{`
            @keyframes countdownGlow {
              0%, 100% { text-shadow: 0 0 20px rgba(0,255,255,0.6), 0 0 40px rgba(0,255,255,0.3); opacity: 0.5; }
              50% { text-shadow: 0 0 40px rgba(0,255,255,0.9), 0 0 80px rgba(0,255,255,0.6), 0 0 120px rgba(0,255,255,0.3); opacity: 1; }
            }
            @keyframes startsInGlow {
              0%, 100% { text-shadow: 0 0 15px rgba(255,0,128,0.5), 0 0 30px rgba(255,0,128,0.2); opacity: 0.5; }
              50% { text-shadow: 0 0 30px rgba(255,0,128,0.8), 0 0 60px rgba(255,0,128,0.5); opacity: 1; }
            }
            .countdown-glow {
              animation: countdownGlow 1.5s ease-in-out infinite;
            }
            .starts-in-glow {
              animation: startsInGlow 1.5s ease-in-out infinite;
            }
          `}</style>
          <div className="text-xs sm:text-sm font-arcade text-neon-pink mb-2 tracking-wider starts-in-glow font-bold">Starts In</div>
          <div className="text-6xl sm:text-7xl md:text-8xl font-arcade font-black text-neon-cyan countdown-glow">
            {countdown}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;
