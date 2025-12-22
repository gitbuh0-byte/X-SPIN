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

export const WHEEL_SEGMENTS = [
  { label: '0', color: 'green', value: 0 },
  { label: '32', color: 'red', value: 32 },
  { label: '15', color: 'black', value: 15 },
  { label: '19', color: 'red', value: 19 },
  { label: '4', color: 'black', value: 4 },
  { label: '21', color: 'red', value: 21 },
  { label: '2', color: 'black', value: 2 },
  { label: '25', color: 'red', value: 25 },
  { label: '17', color: 'black', value: 17 },
  { label: '34', color: 'red', value: 34 },
  { label: '6', color: 'black', value: 6 },
  { label: '27', color: 'red', value: 27 },
  { label: '13', color: 'black', value: 13 },
  { label: '36', color: 'red', value: 36 },
  { label: '11', color: 'black', value: 11 },
  { label: '30', color: 'red', value: 30 },
  { label: '8', color: 'black', value: 8 },
  { label: '23', color: 'red', value: 23 },
  { label: '10', color: 'black', value: 10 },
  { label: '5', color: 'red', value: 5 },
  { label: '24', color: 'black', value: 24 },
  { label: '16', color: 'red', value: 16 },
  { label: '33', color: 'black', value: 33 },
  { label: '1', color: 'red', value: 1 },
  { label: '20', color: 'black', value: 20 },
  { label: '14', color: 'red', value: 14 },
  { label: '31', color: 'black', value: 31 },
  { label: '9', color: 'red', value: 9 },
  { label: '22', color: 'black', value: 22 },
  { label: '18', color: 'red', value: 18 },
  { label: '29', color: 'black', value: 29 },
  { label: '7', color: 'red', value: 7 },
  { label: '28', color: 'black', value: 28 },
  { label: '12', color: 'red', value: 12 },
  { label: '35', color: 'black', value: 35 },
  { label: '3', color: 'red', value: 3 },
  { label: '26', color: 'black', value: 26 },
];

export const INITIAL_BOT_NAMES = ['CryptoKing', 'LuckySpinner', 'WheelMaster', 'JackpotJoe', 'RiskTaker99', 'SafeBetSally'];