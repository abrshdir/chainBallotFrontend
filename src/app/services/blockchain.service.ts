import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BlockchainVotingStats {
  redVotes: number;
  blueVotes: number;
  totalVotes: number;
}

export interface Voter {
  party: string;
  voter: string;
}

export type Voters = Voter[];


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
export class BlockchainService {
  private apiUrl = `${environment.apiUrl}`;
  private votingStats = new BehaviorSubject<BlockchainVotingStats>({
    redVotes: 0,
    blueVotes: 0,
    totalVotes: 0
  });

  private allVotes = new BehaviorSubject<Voters>([])


  constructor(private http: HttpClient) {
    this.http.get<BlockchainVotingStats>(`${this.apiUrl}/vote-count`)
      .subscribe(stats => this.votingStats.next(stats));
    this.pollVotingStats();
  }

  /**
   * Poll voting stats from the backend
   */
  private pollVotingStats() {
    setInterval(() => {
      this.http.get<BlockchainVotingStats>(`${this.apiUrl}/vote-count`)
        .subscribe(stats => this.votingStats.next(stats));
        this.getAllVotes();
    }, 5000);
  }


  /**
   * Send the signed vote payload to the backend
   */
  castVote(signedPayload: SignedVotePayload): Observable<{ transactionHash: string }> {
    return this.http.post<{ transactionHash: string }>(`${this.apiUrl}/cast-vote`, signedPayload);
  }

  /**
   * Get voting stats as an observable
   */
  getVotingStats(): Observable<BlockchainVotingStats> {
    return this.votingStats.asObservable();
  }

  /**
   * Pull voting stats from the backend
   */
  getAllVotes() {
    return this.http.get<Array<Voters>>(`${this.apiUrl}/vote-all`);
  }

  /**
   * Verify if the current user has voted
   */
  verifyVote(address: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/has-voted`, {
      params: { address }
    });
  }
}