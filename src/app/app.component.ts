import { Component } from '@angular/core';
import { VotingDashboardComponent } from './voting-dashboard/voting-dashboard.component';
import { FormsModule } from '@angular/forms';
import { WalletService } from './services/wallet.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VotingDashboardComponent, FormsModule],
  providers: [WalletService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'voting-frontend';
}
