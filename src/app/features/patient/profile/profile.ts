import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

type TelegramView = 'connect' | 'code' | 'linked';

@Component({
  selector: 'app-patient-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  editing = signal(false);
  editName = '';
  editEmail = '';

  successMessage = signal('');
  errorMessage = signal('');

  telegramView = signal<TelegramView>('connect');
  telegramChecking = signal(true);
  telegramConnecting = signal(false);
  telegramCode = signal('');
  telegramBotLink = signal('');

  ngOnInit(): void {
    this.loadTelegramStatus();
  }

  showEdit(): void {
    const u = this.auth.user();
    this.editName = u?.name ?? '';
    this.editEmail = u?.email ?? '';
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  async saveProfile(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');
    try {
      await this.api.patch('/patients/profile', { name: this.editName, email: this.editEmail });
      const u = this.auth.user();
      if (u) this.auth.user.set({ ...u, name: this.editName, email: this.editEmail });
      this.editing.set(false);
      this.successMessage.set('Profile updated successfully.');
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    }
  }

  private async loadTelegramStatus(): Promise<void> {
    this.telegramChecking.set(true);
    try {
      const { linked } = await this.api.get<{ linked: boolean }>('/telegram/status');
      this.telegramView.set(linked ? 'linked' : 'connect');
    } catch {
      // leave default 'connect' view
    } finally {
      this.telegramChecking.set(false);
    }
  }

  async generateLinkCode(): Promise<void> {
    this.telegramConnecting.set(true);
    try {
      const data = await this.api.post<{ code: string; bot_link: string }>('/telegram/link-code');
      this.telegramCode.set(data.code.split('').join(' '));
      this.telegramBotLink.set(data.bot_link);
      this.telegramView.set('code');
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    } finally {
      this.telegramConnecting.set(false);
    }
  }

  async unlinkTelegram(): Promise<void> {
    try {
      await this.api.post('/telegram/unlink');
      this.telegramView.set('connect');
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    }
  }
}
