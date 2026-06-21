import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Reminder } from '../../../core/models/reminder.model';

@Component({
  selector: 'app-patient-history',
  templateUrl: './history.html',
})
export class History implements OnInit {
  private api = inject(ApiService);

  logs = signal<Reminder[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  badgeClass: Record<string, string> = {
    Completed: 'bg-green-50 text-green-700 border border-green-200',
    Active: 'bg-primary/10 text-primary-dark border border-primary/20',
    Ignored: 'bg-amber-50 text-amber-700 border border-amber-200',
  };

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.logs.set(await this.api.get<Reminder[]>('/reminders/history'));
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  medOf(l: Reminder) {
    return typeof l.prescriptionId === 'object' ? l.prescriptionId?.medicationId : undefined;
  }

  formatTime(t?: string): string {
    if (!t) return '—';
    if (typeof t === 'string' && t.includes(':')) {
      const [h, m] = t.split(':');
      const hr = parseInt(h, 10);
      return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    }
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
