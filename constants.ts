import { PaymentMethod, UserRank } from './types.ts';

export const PAYMENT_METHODS = [
  { id: PaymentMethod.PAYPAL, name: 'PayPal', icon: '🅿️' },
  { id: PaymentMethod.MPESA, name: 'M-Pesa', icon: '📱' },
  { id: PaymentMethod.AIRTEL, name: 'Airtel Money', icon: '🔴' },
  { id: PaymentMethod.PAYSTACK, name: 'Paystack', icon: '💳' },
  { id: PaymentMethod.PESAPAL, name: 'Pesapal', icon: '🦅' },
];

export const RANK_CONFIG = {
  [UserRank.ROOKIE]: {
    label: 'ROOKIE',
    color: '#64748b', // Slate
    borderColor: 'border-slate-500',
    shadowColor: '#64748b',
    minWins: 0,
    privilege: 'Standard Access'
  },
  [UserRank.PRO]: {
    label: 'PRO',
    color: '#ffd700', // Gold
    borderColor: 'border-neon-gold',
    shadowColor: '#ffd700',
    minWins: 5,
    privilege: '4% Deposit Bonus'
  },
  [UserRank.MASTER]: {
    label: 'MASTER',
    color: '#bf00ff', // Purple
    borderColor: 'border-neon-purple',
    shadowColor: '#bf00ff',
    minWins: 10,
    privilege: 'Create Room Access'
  },
  [UserRank.LEGEND]: {
    label: 'LEGEND',
    color: '#00ffff', // Cyan
    borderColor: 'border-neon-cyan',
    shadowColor: '#00ffff',
    minWins: 15,
    privilege: '10% Winnings Bonus'
  }
};

export const AVATARS = [
  'https://picsum.photos/seed/user1/50/50',
  'https://picsum.photos/seed/user2/50/50',
  'https://picsum.photos/seed/user3/50/50',
  'https://picsum.photos/seed/user4/50/50',
  'https://picsum.photos/seed/user5/50/50',
];

// Ultra-vibrant, bright colors with ZERO similarity - maximum visual separation
export const COLORS = [
  'red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 
  'purple', 'magenta', 'white', 'pink', 'green', 'gold'
];

export const COLOR_HEX = {
  red: '#FF0000',           // Pure bright red
  orange: '#FF8800',        // Vibrant orange (completely different from red)
  yellow: '#FFFF00',        // Bright pure yellow (completely different from orange)
  lime: '#00FF00',          // Bright lime green (completely different from yellow)
  cyan: '#00FFFF',          // Bright cyan (completely different from green)
  blue: '#0066FF',          // Vibrant bright blue (completely different from cyan)
  purple: '#AA00FF',        // Vibrant purple (completely different from blue)
  magenta: '#FF00FF',       // Bright magenta (completely different from purple)
  white: '#FFFFFF',         // Pure bright white (completely different from magenta)
  pink: '#FF0066',          // Hot bright pink (completely different from white)
  green: '#00AA00',         // Bright pure green (different from lime, different from cyan)
  gold: '#FFAA00'           // Bright gold (different from yellow and orange)
};

export const WHEEL_SEGMENTS = COLORS.flatMap((color, i) => 
  Array(3).fill(null).map((_, idx) => ({
    label: color.substring(0, 3).toUpperCase(),
    color: color as any,
    value: i * 3 + idx
  }))
);

export const INITIAL_BOT_NAMES = ['CryptoKing', 'LuckySpinner', 'WheelMaster', 'JackpotJoe', 'RiskTaker99', 'SafeBetSally'];