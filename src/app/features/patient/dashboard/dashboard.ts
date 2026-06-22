import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Reminder } from '../../../core/models/reminder.model';
import { Medication } from '../../../core/models/medication.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  reminders = signal<Reminder[]>([]);
  errorMessage = signal('');
  loading = signal(true);
  selected = signal<Reminder | null>(null);
  marking = signal(false);

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  get firstName(): string {
    return this.auth.user()?.name?.split(' ')[0] ?? '';
  }

  due = computed(() => this.bucket('active'));
  upcoming = computed(() => this.bucket('upcoming'));
  done = computed(() => this.bucket('done'));

  private bucket(type: 'active' | 'upcoming' | 'done'): Reminder[] {
    const nowUTC = new Date();
    const nowMYT = new Date(nowUTC.getTime() + (8 * 60 * 60 * 1000));
    const nowMins = nowMYT.getHours() * 60 + nowMYT.getMinutes();
    return this.reminders().filter((r) => {
      if (type === 'done') return !!r.completed_today;
      if (r.completed_today) return false;
      const [h, m] = (r.reminder_time || '00:00').split(':').map(Number);
      const isDue = Math.abs(h * 60 + m - nowMins) <= 60;
      return type === 'active' ? isDue : !isDue;
    });
  }

  ngOnInit(): void {
    this.loadReminders();
  }

  async loadReminders(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      this.reminders.set(await this.api.get<Reminder[]>('/reminders/today'));
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  medOf(r: Reminder): Partial<Medication> {
    const p = typeof r.prescriptionId === 'object' ? r.prescriptionId : undefined;
    return p?.medicationId ?? {};
  }

  doctorOf(r: Reminder): Partial<User> {
    const p = typeof r.prescriptionId === 'object' ? r.prescriptionId : undefined;
    return p?.doctorId?.userId ?? {};
  }

  notesOf(r: Reminder): string {
    const p = typeof r.prescriptionId === 'object' ? r.prescriptionId : undefined;
    return p?.notes || '—';
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

  open(r: Reminder): void {
    this.selected.set(r);
  }

  close(): void {
    this.selected.set(null);
  }

  async markTaken(): Promise<void> {
    const r = this.selected();
    if (!r) return;
    const p = typeof r.prescriptionId === 'object' ? r.prescriptionId : undefined;
    if (!p) return;
    this.marking.set(true);
    try {
      await this.api.post('/reminders/mark-taken', {
        prescriptionId: p._id,
        scheduled_time: r.reminder_time,
      });
      this.close();
      await this.loadReminders();
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    } finally {
      this.marking.set(false);
    }
  }
}
