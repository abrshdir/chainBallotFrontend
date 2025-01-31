import { Component, OnInit } from '@angular/core';
import { VotingService, VotingStats } from '../services/voting.service';
import { CommonModule } from '@angular/common';
import * as nacl from 'tweetnacl';
import { WalletService } from '../services/wallet.service';
import { Observable, of } from 'rxjs';
import { Voters } from '../services/blockchain.service';
import { HexToTextPipe } from '../pipes/hex-to-text.pipe';
@Component({
  selector: 'app-voting-dashboard',
  standalone: true,
  imports: [CommonModule, HexToTextPipe],
  templateUrl: './voting-dashboard.component.html',
  styleUrls: ['./voting-dashboard.component.scss']
})
export class VotingDashboardComponent implements OnInit {
  stats: VotingStats | null = null; // Holds the current voting stats
  isLoading = true; // Tracks loading state
  errorMessage: string | null = null; // Holds error messages
  transactionResult: any = null;
  obama: string = 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg';
  trump: string = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Donald_Trump_official_portrait_%28cropped_2%29.jpg/640px-Donald_Trump_official_portrait_%28cropped_2%29.jpg';
  walletAddress: string | null = null;
  votes: Array<Voters> = [];
  voterAddress: string | null = null;
  voterParty: string | null = null;


  constructor(private votingService: VotingService, private walletService: WalletService) { }

  ngOnInit(): void {
    this.loadVotingStats();
    this.getVotes();
  }


  async connectsWallet() {
    this.getProvider();
    await this.walletService.connectWallet();
    this.walletAddress = await this.walletService.getWalletAddress();
    if (this.walletAddress) {
      this.checkMyVoteStatus(this.walletAddress);
      if (this.votes.length > 0 && this.walletAddress) {
        this.getVoter(this.walletAddress);
      }
    };
  }

  private getProvider(): any {
    console.log('window :: ', window);
    if ('starkey' in window) {
      const provider = (window as any)?.starkey.supra;
      if (provider) {
        return provider;
      }
    }
  }

  /**
   * Remove the '0x' prefix from a hex string
   */
  private remove0xPrefix(hexString: string): string {
    return hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  }

  /**
   * Load voting stats from the VotingService
   */
  private loadVotingStats(): void {
    this.votingService.getVotingStats().subscribe({
      next: (stats: VotingStats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading voting stats:', error);
        this.errorMessage = 'Failed to load voting stats. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Cast a vote for the specified party
   */
  async castVote(party: 'red' | 'blue'): Promise<void> {
    if (!this.stats?.isVotingOpen) {
      this.errorMessage = 'Voting is currently closed.';
      return;
    }

    try {
      await this.walletService.castVote(party);
      console.log('Vote cast successfully.');
    } catch (error) {
      console.error('Error casting vote:', error);
    }
  }

  // Function to verify the signature
  async verifySignature(signMessage: string, response: any): Promise<boolean> {
    const { publicKey, signature, address } = response;

    // Remove '0x' prefix from the signature and public key
    const sign = this.remove0xPrefix(signature);
    const key = this.remove0xPrefix(publicKey);

    // Convert the message to a Uint8Array using TextEncoder
    const messageBytes = new TextEncoder().encode(signMessage);

    // Convert the signature and public key to Uint8Array
    const signatureBytes = Uint8Array.from(this.hexToBytes(sign));
    const publicKeyBytes = Uint8Array.from(this.hexToBytes(key));

    // Verify the signature using nacl
    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    console.log('signature :: ', signature);
    console.log('verified :: ', verified);

    return verified;
  }

  // Helper function to convert a hex string to a byte array
  private hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
  }

  private async checkMyVoteStatus(addy: string): Promise<boolean> {
    try {
      const result = await this.votingService.verifiesVote(addy);
      return result;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  private async getVotes() {
    try {
      this.votes = await this.votingService.getAllVoters();
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  }

  public async getVoter(address: string) {
    try {
      const voter = this.votes[0].find(v => v.voter === address);
      console.log('voters :======: ', this.votes);
      console.log('voter :: ', voter);
      if (voter) {
        this.voterAddress = voter.voter;
        this.voterParty = voter.party;
      } else {
        this.voterAddress = null;
        this.voterParty = null;
      }
    } catch (error) {
      console.error('Error loading voter:', error);
    }
  }

  async disconnectWallet() {
    await this.walletService.disconnectWallet();
    this.walletAddress = null;
  }
}