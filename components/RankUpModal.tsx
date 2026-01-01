import React, { useEffect, useState } from 'react';
import { UserRank } from '../types.ts';
import { soundManager } from '../services/soundManager.ts';

interface RankUpModalProps {
  newRank: UserRank;
  previousRank: UserRank;
  onClose: () => void;
}

const RankUpModal: React.FC<RankUpModalProps> = ({ newRank, previousRank, onClose }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    soundManager.play('win');
  }, []);

  if (!animate) return null;

  const rankEmojis: Record<UserRank, string> = {
    [UserRank.ROOKIE]: '🏁',
    [UserRank.PRO]: '⭐',
    [UserRank.MASTER]: '👑',
    [UserRank.LEGEND]: '🏆'
  };

  const rankColors: Record<UserRank, string> = {
    [UserRank.ROOKIE]: 'neon-green',
    [UserRank.PRO]: 'neon-cyan',
    [UserRank.MASTER]: 'neon-gold',
    [UserRank.LEGEND]: 'neon-pink'
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <style>{`
        @keyframes rankUpPulse {
          0%, 100% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes rankUpGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(255,0,128,0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(255,0,128,0.8)); }
        }
        .rank-up-container {
          animation: ${animate ? 'rankUpPulse 0.8s ease-out, rankUpGlow 2s ease-in-out infinite' : 'none'};
        }
      `}</style>

      <div className="rank-up-container text-center max-w-md w-full">
        {/* Celebration Background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animation: `bounce ${2 + Math.random() * 1}s ease-in infinite`,
                animationDelay: `${i * 0.1}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-b from-slate-900/95 to-black/95 border border-neon-pink rounded-lg p-8 backdrop-blur">
          {/* Rank Icon */}
          <div className="text-6xl mb-4 animate-bounce">{rankEmojis[newRank]}</div>

          {/* Congratulations Text */}
          <div className="text-2xl sm:text-3xl font-arcade text-neon-pink mb-2 drop-shadow-[0_0_10px_rgba(255,0,128,0.6)]">
            RANK UP!
          </div>

          {/* Rank Progression */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-arcade mb-1">{rankEmojis[previousRank]}</div>
              <div className="text-sm text-slate-400 font-arcade">{previousRank}</div>
            </div>
            <div className="text-2xl text-neon-pink">→</div>
            <div className="text-center">
              <div className="text-3xl font-arcade mb-1">{rankEmojis[newRank]}</div>
              <div className="text-sm font-arcade text-neon-pink font-bold">{newRank}</div>
            </div>
          </div>

          {/* Congratulations Message */}
          <div className="text-slate-300 mb-6 font-arcade text-sm">
            Congratulations! You've unlocked <span className="text-neon-pink font-bold">{newRank}</span> rank!
          </div>

          {/* Unlock Info */}
          {newRank === UserRank.LEGEND && (
            <div className="bg-neon-gold/20 border border-neon-gold/50 rounded p-3 mb-6 text-xs text-neon-gold font-arcade">
              🎊 You've unlocked the ability to create your own tournament rooms! 🎊
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border border-neon-pink text-neon-pink font-arcade text-lg hover:bg-neon-pink hover:text-black transition font-bold"
          >
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
};

export default RankUpModal;
