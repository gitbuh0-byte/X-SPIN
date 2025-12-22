
export enum PaymentMethod {
  PAYPAL = 'PayPal',
  MPESA = 'M-Pesa',
  AIRTEL = 'Airtel Money',
  PAYSTACK = 'Paystack',
  PESAPAL = 'Pesapal'
}

export enum GameState {
  WAITING = 'WAITING',
  BETTING = 'BETTING',
  LOCKED = 'LOCKED',
  SPINNING = 'SPINNING',
  RESULT = 'RESULT'
}

export enum PlayerStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  PLACED = 'PLACED', // Bet placed, in 5s window
  CONFIRMED = 'CONFIRMED' // 5s passed, locked in
}

export enum UserRank {
  ROOKIE = 'ROOKIE',
  PRO = 'PRO',
  MASTER = 'MASTER',
  LEGEND = 'LEGEND'
}

export interface User {
  id: string;
  username: string;
  balance: number;
  avatar: string;
  rank: UserRank;
  rankXp: number; // Wins in competitive modes
  email?: string;
  bio?: string;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  betAmount: number;
  selectedColor: string;
  assignedColor: string; // The color this player must bet on
  status: PlayerStatus;
  isBot: boolean;
  lockInTime?: number; // Timestamp when bet becomes confirmed
  color?: string;
  rank?: UserRank; // Display rank in game
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'WIN' | 'LOSS';
  amount: number;
  method?: PaymentMethod;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface Room {
  id: string;
  name: string;
  type: 'COMPETITIVE' | 'TOURNAMENT';
  capacity: number;
  entryFee: number;
  prizePool: number;
  players: Player[];
  gameState: GameState;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isAi?: boolean;
  timestamp: Date;
}

export interface GameSession {
  id: string;
  type: string;
  status: string; // e.g., "SPINNING", "WAITING"
  themeColor: string;
  lastUpdate: number;
}
