import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WalletService } from './wallet.service';
import { BlockchainService, BlockchainVotingStats, Voters } from './blockchain.service';

export interface VotingStats {
  totalVotes: number;
  redVotes: number;
  blueVotes: number;
  isVotingOpen: boolean;
}

export interface SignedVotePayload {
  payload: {
    party: 'red' | 'blue';
  };
  signature: string;
  publicKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class VotingService {
  private votingStats = new BehaviorSubject<VotingStats>({
    totalVotes: 0,
    redVotes: 0,
    blueVotes: 0,
    isVotingOpen: true
  });

  constructor(private blockchainService: BlockchainService, private walletService: WalletService) {
    this.initializeStatsPolling();
  }

  /**
   * Initialize polling for voting stats from the blockchain service
   */
  private initializeStatsPolling() {
    this.blockchainService.getVotingStats().subscribe((stats: BlockchainVotingStats) => {
      this.votingStats.next({
        totalVotes: stats.totalVotes,
        redVotes: stats.redVotes,
        blueVotes: stats.blueVotes,
        isVotingOpen: true // Can be controlled by additional logic
      });
    });
  }
  /**
   * Get voting stats as an observable
   */
  getVotingStats(): Observable<VotingStats> {
    return this.votingStats.asObservable();
  }

  /**
   * Get All voters as an observable
   */
  async getAllVoters(): Promise<Voters[]> {
    try {
      const response = await this.blockchainService.getAllVotes().toPromise();
      return response || [];
    } catch (error) {
      console.error('Error verifying vote:', error);
      throw new Error('Failed to verify vote. Please try again.');
    }
  }

  /**
   * Verify if the current user has voted (with validation)
   */
  async verifiesVote(address: string): Promise<boolean> {
    try {
      const response = await this.blockchainService.verifyVote(address).toPromise();
      return response || false;
    } catch (error) {
      console.error('Error verifying vote:', error);
      throw new Error('Failed to verify vote. Please try again.');
    }
  }
}