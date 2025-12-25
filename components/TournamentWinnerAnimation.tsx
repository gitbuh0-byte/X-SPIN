import React, { useEffect, useState } from 'react';

interface TournamentWinnerAnimationProps {
  isUserWinner: boolean;
  winnerCount: number;
}

const TournamentWinnerAnimation: React.FC<TournamentWinnerAnimationProps> = ({ isUserWinner, winnerCount }) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate random confetti particles
    const particles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1.5
    }));
    setConfetti(particles);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Confetti layer - behind everything */}
      {confetti.map(p => {
        const emoji = ['🎉', '✨', '🎊', '🥳', '💥', '🪅', '🎈'][p.id % 7];
        return (
          <div
            key={p.id}
            className="absolute text-sm sm:text-lg md:text-2xl"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `fall ${p.duration}s linear forwards`,
              animationDelay: `${p.delay}s`,
              opacity: 0.8
            }}
          >
            {emoji}
          </div>
        );
      })}

      {/* Text above winner cards - non-obstructing */}
      <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 text-center px-4 w-full">
        <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">🏆</div>
        <div className="bg-gradient-to-r from-neon-gold via-neon-cyan to-neon-pink bg-clip-text text-transparent text-lg sm:text-2xl md:text-3xl font-arcade font-black tracking-wider">
          GROUP WINNERS!
        </div>
        {isUserWinner && (
          <div className="mt-2 sm:mt-3 text-neon-green font-arcade text-xs sm:text-sm md:text-lg drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]">
            🎊 YOU ADVANCED! 🎊
          </div>
        )}
        <div className="mt-1 sm:mt-2 text-neon-cyan font-arcade text-[9px] sm:text-[10px] md:text-xs tracking-widest">
          {winnerCount} Winners Selected
        </div>
      </div>

      {/* Falling animation keyframes */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TournamentWinnerAnimation;
