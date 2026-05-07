export type Role = 'admin' | 'planner';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface TargetingSignal {
  type: 'demographic' | 'interest' | 'location' | 'transaction';
  field: string;
  value: string;
  description: string;
}

export interface Audience {
  id: string;
  name: string;
  signals: TargetingSignal[];
  estimatedSize: number;
  createdAt: string;
  userId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  signals?: TargetingSignal[];
  estimatedSize?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: string;
  userId: string;
}
