import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Prescription } from '../../../core/models/prescription.model';
import { Reminder } from '../../../core/models/reminder.model';

@Component({
  selector: 'app-patient-medications',
  templateUrl: './medications.html',
})
export class Medications implements OnInit {
  private api = inject(ApiService);

  prescriptions = signal<Prescription[]>([]);
  reminders = signal<Reminder[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  selected = signal<Prescription | null>(null);

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.prescriptions.set(await this.api.get<Prescription[]>('/prescriptions/my'));
      if (this.prescriptions().length) {
        this.reminders.set(await this.api.get<Reminder[]>('/reminders/today'));
      }
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  reminderTimesFor(p: Prescription): string {
    const mine = this.reminders().filter((r) => {
      const rid = typeof r.prescriptionId === 'object' ? r.prescriptionId?._id : r.prescriptionId;
      return rid === p._id;
    });
    return mine.length ? mine.map((r) => this.formatTime(r.reminder_time)).join(', ') : 'No reminders set';
  }

  daysLeft(p: Prescription): number | null {
    if (!p.end_date) return null;
    const end = new Date(p.end_date);
    const today = new Date();
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  daysLeftClass(days: number | null): string {
    if (days === null) return '';
    if (days <= 7) return 'bg-red-50 border border-red-200 text-red-600';
    if (days <= 14) return 'bg-amber-50 border border-amber-200 text-amber-700';
    return 'bg-green-50 border border-green-200 text-green-700';
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateLong(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
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

  open(p: Prescription): void {
    this.selected.set(p);
  }

  close(): void {
    this.selected.set(null);
  }
}
