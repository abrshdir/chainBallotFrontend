export interface Vote {
  id: string;
  userId: string;
  party: 'red' | 'blue';
  timestamp: Date;
}

export interface VotingStats {
  totalVoters: number;
  totalVotes: number;
  redVotes: number;
  blueVotes: number;
  isVotingOpen: boolean;
}