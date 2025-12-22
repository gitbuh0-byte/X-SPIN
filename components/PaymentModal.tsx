import React, { useState } from 'react';
import { PAYMENT_METHODS } from '../constants.ts';
import { PaymentMethod } from '../types.ts';
import { soundManager } from '../services/soundManager.ts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcess: (method: PaymentMethod, amount: number) => void;
  type: 'DEPOSIT' | 'WITHDRAWAL';
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onProcess, type }) => {
  const [amount, setAmount] = useState<string>('50');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProcess = () => {
    if (!selectedMethod || !amount) return;
    soundManager.play('lock');
    setProcessing(true);
    setTimeout(() => {
      onProcess(selectedMethod, parseFloat(amount));
      setProcessing(false);
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    soundManager.play('click');
    onClose();
  };

  const handleMethodSelect = (id: PaymentMethod) => {
    soundManager.play('click');
    setSelectedMethod(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-vegas-panel border-2 border-neon-green box-glow-green p-1 rounded-sm w-full max-w-lg shadow-[0_0_50px_rgba(0,255,0,0.2)] transform transition-all relative">
        {/* Decor lines */}
        <div className="absolute top-0 left-10 right-10 h-1 bg-neon-green shadow-[0_0_10px_lime]"></div>
        <div className="absolute bottom-0 left-10 right-10 h-1 bg-neon-green shadow-[0_0_10px_lime]"></div>

        <div className="p-8">
          <h2 className="text-3xl font-arcade text-center text-neon-green mb-8 uppercase tracking-widest text-shadow-sm">
            {type === 'DEPOSIT' ? 'Insert Credits' : 'Cash Out'}
          </h2>
          
          <div className="mb-8">
            <label className="block text-neon-green text-xs font-bold uppercase tracking-wider mb-4 text-center">- Select Processor -</label>
            <div className="grid grid-cols-3 gap-4">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id)}
                  className={`flex flex-col items-center justify-center p-4 border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-neon-gold bg-neon-gold/10 text-neon-gold shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                      : 'border-slate-700 bg-black text-slate-500 hover:border-slate-400'
                  }`}
                >
                  <span className="text-2xl mb-2 filter grayscale hover:grayscale-0 transition-all">{method.icon}</span>
                  <span className="text-[10px] font-bold uppercase">{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 text-center">
            <label className="block text-neon-green text-xs font-bold uppercase tracking-wider mb-2">Amount</label>
            <div className="relative inline-block w-full max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green text-xl">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black border-2 border-neon-green py-3 pl-10 pr-4 text-center text-neon-green font-arcade text-2xl focus:outline-none focus:shadow-[0_0_20px_rgba(0,255,0,0.4)]"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleClose}
              className="flex-1 py-4 border-2 border-red-500 text-red-500 font-arcade hover:bg-red-500 hover:text-black transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={!selectedMethod || processing}
              className={`flex-1 py-4 font-arcade uppercase tracking-widest transition-all ${
                !selectedMethod || processing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-neon-green text-black hover:bg-white hover:shadow-[0_0_20px_lime]'
              }`}
            >
              {processing ? 'Processing...' : 'CONFIRM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;