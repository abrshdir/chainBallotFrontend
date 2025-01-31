import { Component } from '@angular/core';
import { WalletService } from '../services/wallet.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-send-transaction',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './send-transaction.component.html',
  styleUrl: './send-transaction.component.scss'
})
export class SendTransactionComponent {
  toAddress: string = '';
  amount: string = '';

  constructor(public walletService: WalletService) { }

  async sendTransaction() {
    if (!this.toAddress || !this.amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await this.walletService.sendTransaction(this.toAddress, this.amount);
      alert('Transaction sent successfully!');
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed');
    }
  }
}
