import React, { useState, useEffect } from 'react';
import { soundManager } from '../services/soundManager.ts';

interface BettingModalProps {
  isOpen: boolean;
  userBalance?: number;
  balance?: number;
  minBet?: number;
  maxBet?: number;
  onConfirm: (betAmount: number) => void;
  onCancel: () => void;
  gameMode: 'blitz' | '1v1' | 'tournament' | 'grandprix';
}

const BettingModal: React.FC<BettingModalProps> = ({
  isOpen,
  userBalance,
  balance,
  minBet = 10,
  maxBet,
  onConfirm,
  onCancel,
  gameMode
}) => {
  const [betAmount, setBetAmount] = useState<string>('50');
  const [error, setError] = useState<string>('');
  const availableBalance = balance || userBalance || 0;
  const maxAllowed = maxBet || availableBalance;

  if (!isOpen) return null;

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBetAmount(value);
    setError('');
  };

  const handleQuickBet = (amount: number) => {
    if (amount <= availableBalance && amount >= minBet) {
      setBetAmount(amount.toString());
      setError('');
      soundManager.play('click');
    } else {
      setError('Invalid bet amount');
      soundManager.play('warning');
    }
  };

  const handleConfirm = () => {
    const amount = parseInt(betAmount);

    if (isNaN(amount)) {
      setError('Please enter a valid amount');
      soundManager.play('warning');
      return;
    }

    if (amount < minBet) {
      setError(`Minimum bet is $${minBet}`);
      soundManager.play('warning');
      return;
    }

    if (amount > availableBalance) {
      setError('Insufficient balance');
      soundManager.play('warning');
      return;
    }

    if (amount > maxAllowed) {
      setError(`Maximum bet is $${maxAllowed}`);
      soundManager.play('warning');
      return;
    }

    soundManager.play('lock');
    onConfirm(amount);
  };

  const modeConfig = {
    blitz: { name: 'BLITZ', color: 'neon-cyan', description: '15-Player Lobby' },
    '1v1': { name: '1v1 DUEL', color: 'neon-green', description: 'Head to Head' },
    tournament: { name: 'TOURNAMENT', color: 'neon-pink', description: '20-Player Elite' },
    grandprix: { name: 'GRAND PRIX', color: 'neon-pink', description: '100 Players • 10 Groups' }
  };

  const config = modeConfig[gameMode];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-lg p-3 sm:p-4">
      <div className={`bg-vegas-panel/95 border border-${config.color}/50 p-4 sm:p-6 md:p-8 rounded-lg w-full max-w-md relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50"></div>
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className={`text-4xl sm:text-5xl md:text-6xl font-arcade font-black text-${config.color} mb-2 text-glow-cyan`}>
            💰
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-arcade text-white mb-1 tracking-widest uppercase">
            PLACE YOUR BET
          </h2>
          <p className={`text-xs sm:text-sm font-mono text-${config.color} opacity-80`}>
            {config.name} • {config.description}
          </p>
        </div>

        {/* Balance Display */}
        <div className="bg-black/40 border border-white/10 rounded-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            Available Balance
          </div>
          <div className="text-2xl sm:text-3xl md:text-4xl font-arcade text-neon-green font-black">
            ${userBalance.toLocaleString()}
          </div>
        </div>

        {/* Bet Input */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-slate-400 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">
            Bet Amount ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-neon-cyan font-arcade text-base sm:text-lg">$</span>
            <input
              type="number"
              value={betAmount}
              onChange={handleBetChange}
              className="w-full bg-black/50 border border-white/20 p-3 sm:p-4 pl-8 sm:pl-10 text-white font-arcade text-lg sm:text-xl focus:border-neon-cyan focus:outline-none focus:bg-black/70 focus:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all rounded-sm"
              placeholder="50"
              min={minBet}
              max={maxAllowed}
            />
          </div>
          {error && (
            <div className="text-neon-pink text-[9px] sm:text-xs font-bold mt-2 uppercase tracking-widest">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Quick Bet Buttons */}
        <div className="mb-6 sm:mb-8">
          <div className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-2">
            Quick Select
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map(amount => (
              <button
                key={amount}
                onClick={() => handleQuickBet(amount)}
                disabled={amount > userBalance}
                className={`py-2 sm:py-2.5 border font-arcade text-[9px] sm:text-xs uppercase tracking-widest transition-all rounded-sm ${
                  amount > userBalance
                    ? 'border-slate-700 text-slate-600 opacity-50 cursor-not-allowed'
                    : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Info Text */}
        <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-sm p-3 sm:p-4 mb-6 sm:mb-8">
          <p className="text-slate-400 text-[9px] sm:text-xs font-mono leading-relaxed">
            Your bet is locked in once confirmed. You cannot enter the game room without placing a bet.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4">
          <button
            onClick={() => {
              soundManager.play('click');
              onCancel();
            }}
            className="flex-1 py-2.5 sm:py-3 border border-slate-700 text-slate-400 font-arcade hover:border-white hover:text-white transition-colors uppercase text-[9px] sm:text-xs tracking-wide rounded-sm"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 sm:py-3 bg-neon-cyan text-black font-arcade hover:bg-neon-cyan/80 transition-colors uppercase text-[9px] sm:text-xs tracking-wide rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.4)] font-black"
          >
            CONFIRM BET
          </button>
        </div>
      </div>
    </div>
  );
};

export default BettingModal;
