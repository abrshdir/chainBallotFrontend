import { Injectable } from '@angular/core';
import { BCS, HexString } from '../../../node_modules/supra-l1-sdk';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private supraProvider: any;
  private address: string | null = null;
  private moduleAddress: string = "0x815cea0cffe1658f1006bdc08b78a34eec6075c899b2b8aea5a397a8b57001ba";
  data: any;

  constructor() {
    this.supraProvider = (window as any)?.starkey?.supra;
  }

  // Connect to Supra Star Key Wallet
  async connectWallet(): Promise<void> {
    if (this.supraProvider) {
      const response = await this.supraProvider.connect();
      if (response) {
        this.address = response[0];
        console.log('Wallet connected:', this.address);
      }
    } else {
      console.error('Supra Star Key Wallet not found!');
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this.supraProvider) {
      await this.supraProvider.disconnect();
      this.address = null;
    }
  }

  // Get the connected wallet address
  async getWalletAddress(): Promise<string | null> {
    return this.address;
  }

  /**
   * Cast a vote directly using the Supra wallet
   */
  async castVote(party: 'red' | 'blue'): Promise<void> {
    if (!party || (party !== 'red' && party !== 'blue' && this.address)) {
      throw new Error('Invalid party specified. Party must be "red" or "blue".');
    }

    try {
      // Connect to the wallet if not already connected
      if (!await this.getWalletAddress()) {
        await this.connectWallet();
      }

      // Set expiration time for raw transaction to 30 seconds
      const txExpiryTime = Math.ceil(Date.now() / 1000) + 300; // 300 seconds

      const partyEncoder = new TextEncoder();
      const partyBytes = partyEncoder.encode(party);
      const partySerializer = new BCS.Serializer();
      partySerializer.serializeBytes(partyBytes);
      const serializedParty = partySerializer.getBytes();
      const voterAddressBytes = new HexString(this.address!.replace('0x', '')).toUint8Array();


      const optionalTransactionPayloadArgs = {
        txExpiryTime
      };

      const account = await this.supraProvider.account();

      console.log("account :: ", account);

      const rawTxPayload = [
        account[0],
        0,
        this.moduleAddress,
        'voting_system3',
        'cast_vote',
        [],
        [
          voterAddressBytes,
          serializedParty
        ],
        optionalTransactionPayloadArgs
      ];


      try {
        console.log("rawTxPayload :: ", rawTxPayload);
        this.data = await this.supraProvider.createRawTransactionData(rawTxPayload);
        if (!this.data) {
          console.error("createRawTransactionData returned null");
        } else {
          console.log("raw Data :: ", this.data);
        }
      } catch (error) {
        console.error("Error creating raw transaction data:", error);
        throw new Error("Failed to create raw transaction data. Please check the payload and try again.");
      }

      const data = await this.supraProvider.getChainId();

      if (this.data) {
        const params = {
          data: this.data,
          from: await this.getWalletAddress(),
          to: this.moduleAddress, // Target the deployed contract
          chainId: data.chainId,
          value: 0,
        };
        const txHash = await this.supraProvider.sendTransaction(params);
        console.log("txHash :: ", txHash);
        // Store the voter's choice in localStorage
        localStorage.setItem('voterParty', party);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      throw new Error('Failed to cast vote. Please try again.');
    }
  }

  /*
  * people who voted and for whom they voted
  *
  */
  async getVotes(): Promise<Array<{ voter: string, party: string }>> {
    if (!this.supraProvider) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await this.supraProvider.call({
        moduleAddress: this.moduleAddress,
        moduleName: 'voting_system3',
        functionName: 'get_votes',
        args: [],
      });

      if (response) {
        return response.map((vote: [string, Uint8Array]) => ({
          voter: vote[0],
          party: new TextDecoder().decode(vote[1]),
        }));
      } else {
        console.error('Failed to retrieve votes');
        return [];
      }
    } catch (error) {
      console.error('Error retrieving votes:', error);
      throw new Error('Failed to retrieve votes. Please try again.');
    }
  }

  getVoterParty(): string | null {
    return localStorage.getItem('voterParty');
  }
}