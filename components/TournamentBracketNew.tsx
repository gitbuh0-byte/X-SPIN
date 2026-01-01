import React, { useState, useEffect } from 'react';

interface TournamentBracketProps {
  countdown: number;
  groupNumber: number;
  playersInGroup: number;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ countdown, groupNumber, playersInGroup }) => {
  return (
    <div className="flex flex-col items-center justify-start h-full gap-4 p-4 overflow-y-auto bg-black/40">
      {/* Header */}
      <div className="text-center pt-2 flex-shrink-0">
        <div className="text-3xl sm:text-4xl md:text-5xl font-arcade text-neon-cyan mb-1 tracking-widest">
          GROUP {groupNumber}
        </div>
        <div className="text-xs sm:text-sm text-slate-400 font-mono">
          {playersInGroup} Players Competing
        </div>
      </div>

      {/* Bracket Container - Vertical Flow */}
      <div className="w-full flex flex-col items-center gap-4 flex-shrink-0">
        
        {/* QUARTERFINALS */}
        <div className="w-full max-w-xs">
          <div className="text-center text-xs text-slate-500 font-arcade mb-2 tracking-wider uppercase">Quarterfinals</div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map(i => (
              <div key={`qf-${i}`} className="bg-black/60 border-2 border-neon-cyan/60 rounded p-2 text-center">
                <div className="text-[10px] text-slate-400 font-mono mb-0.5">TBD</div>
                <div className="text-[9px] text-slate-500">vs</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">TBD</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow Down */}
        <div className="text-neon-cyan text-xl">↓</div>

        {/* SEMIFINALS */}
        <div className="w-full max-w-xs">
          <div className="text-center text-xs text-slate-500 font-arcade mb-2 tracking-wider uppercase">Semifinals</div>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map(i => (
              <div key={`sf-${i}`} className="bg-black/60 border-2 border-neon-purple/60 rounded p-2 text-center">
                <div className="text-[10px] text-slate-400 font-mono mb-0.5">TBD</div>
                <div className="text-[9px] text-slate-500">vs</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">TBD</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow Down */}
        <div className="text-neon-purple text-xl">↓</div>

        {/* FINAL */}
        <div className="w-full max-w-xs">
          <div className="text-center text-xs text-slate-500 font-arcade mb-2 tracking-wider uppercase">Grand Final</div>
          <div className="bg-black/80 border-3 border-neon-gold/80 rounded p-3 text-center">
            <div className="text-[11px] text-neon-gold font-arcade font-bold mb-1">Final Showdown</div>
            <div className="text-[9px] text-slate-400 font-mono">TBD vs TBD</div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="text-neon-gold text-xl">↓</div>

        {/* CHAMPION TROPHY */}
        <div className="text-center py-2">
          <div className="text-5xl sm:text-6xl mb-1">🏆</div>
          <div className="text-neon-gold font-arcade text-xs font-bold tracking-wider">CHAMPION</div>
        </div>
      </div>

      {/* Countdown - Sticky at bottom */}
      <div className="text-center flex-shrink-0 mt-auto pb-2">
        <div className="text-sm sm:text-base font-arcade text-neon-pink mb-1">Starts In</div>
        <div className="text-4xl sm:text-5xl md:text-6xl font-arcade font-black text-neon-cyan animate-pulse" style={{ textShadow: '0 0 20px rgba(0,255,255,0.6)' }}>
          {countdown}
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;
