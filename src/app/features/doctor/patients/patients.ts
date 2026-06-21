import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Patient } from '../../../core/models/patient.model';
import { Reminder } from '../../../core/models/reminder.model';

type Tab = 'today' | 'history';

@Component({
  selector: 'app-doctor-patients',
  imports: [FormsModule, RouterLink],
  templateUrl: './patients.html',
})
export class Patients implements OnInit, OnDestroy {
  private api = inject(ApiService);

  allPatients = signal<Patient[]>([]);
  searchResults = signal<Patient[] | null>(null); // null = not searching
  loadError = signal('');

  searchQuery = '';
  searching = signal(false);

  assignPhone = '';
  assignError = signal('');
  assignSuccess = signal('');

  private debounceTimer?: ReturnType<typeof setTimeout>;

  // Intake modal
  intakeOpen = signal(false);
  intakePatientId = signal<string | null>(null);
  intakePatientName = signal('');
  activeTab = signal<Tab>('today');

  todayLoading = signal(true);
  todayError = signal('');
  todayReminders = signal<Reminder[]>([]);

  historyLoading = signal(true);
  historyError = signal('');
  historyLogs = signal<Reminder[]>([]);

  taken = computed(() => this.todayReminders().filter((r) => r.completed_today).length);
  pending = computed(() => this.todayReminders().filter((r) => !r.completed_today).length);
  adherencePct = computed(() => {
    const total = this.todayReminders().length;
    return total ? Math.round((this.taken() / total) * 100) : 0;
  });

  historyBadge: Record<string, string> = {
    Completed: 'bg-green-50 text-green-700 border border-green-200',
    Active: 'bg-primary/10 text-primary-dark border border-primary/20',
    Ignored: 'bg-red-50 text-red-600 border border-red-200',
  };

  get rows(): { list: Patient[]; mode: 'assigned' | 'search' } {
    const results = this.searchResults();
    return results === null ? { list: this.allPatients(), mode: 'assigned' } : { list: results, mode: 'search' };
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounceTimer);
  }

  async loadPatients(): Promise<void> {
    try {
      this.allPatients.set(await this.api.get<Patient[]>('/patients'));
    } catch (e) {
      this.loadError.set((e as Error).message);
    }
  }

  isMine(p: Patient, mode: 'assigned' | 'search'): boolean {
    return mode === 'assigned' ? true : !!p.isMyPatient;
  }

  careBadge(p: Patient, mode: 'assigned' | 'search'): string {
    if (mode !== 'search') return '';
    if (p.isMyPatient) return 'Your patient';
    if (p.doctorId) return `Under Dr. ${p.doctorId.userId?.name?.split(' ').pop() || 'another doctor'}`;
    return 'Unassigned';
  }

  onSearchInput(): void {
    const query = this.searchQuery.trim();
    clearTimeout(this.debounceTimer);

    if (!query) {
      this.searching.set(false);
      this.searchResults.set(null);
      return;
    }

    this.searching.set(true);
    this.debounceTimer = setTimeout(async () => {
      try {
        const results = await this.api.get<Patient[]>(`/patients/search?name=${encodeURIComponent(query)}`);
        this.searchResults.set(results);
      } catch (e) {
        this.loadError.set((e as Error).message);
      } finally {
        this.searching.set(false);
      }
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    clearTimeout(this.debounceTimer);
    this.searching.set(false);
    this.searchResults.set(null);
  }

  async assignFromSearch(phone?: string): Promise<void> {
    if (!phone) return;
    try {
      await this.api.post('/patients/assign', { phone_number: phone });
      this.assignSuccess.set('Patient assigned successfully.');
      await this.loadPatients();
      if (this.searchQuery.trim()) this.onSearchInput();
    } catch (e) {
      this.assignError.set((e as Error).message);
    }
  }

  async assignPatient(): Promise<void> {
    const phone = this.assignPhone.trim();
    this.assignError.set('');
    this.assignSuccess.set('');
    if (!phone) {
      this.assignError.set('Enter a phone number.');
      return;
    }
    try {
      await this.api.post('/patients/assign', { phone_number: phone });
      this.assignPhone = '';
      this.assignSuccess.set('Patient assigned successfully.');
      await this.loadPatients();
      if (this.searchQuery.trim()) this.onSearchInput();
    } catch (e) {
      this.assignError.set((e as Error).message);
    }
  }

  // ── Intake modal ──
  openIntake(patientId: string, patientName: string): void {
    this.intakePatientId.set(patientId);
    this.intakePatientName.set(patientName);
    this.intakeOpen.set(true);
    this.switchTab('today');
  }

  closeIntake(): void {
    this.intakeOpen.set(false);
    this.intakePatientId.set(null);
  }

  switchTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'today') this.loadIntakeToday();
    else this.loadIntakeHistory();
  }

  private async loadIntakeToday(): Promise<void> {
    const id = this.intakePatientId();
    if (!id) return;
    this.todayLoading.set(true);
    this.todayError.set('');
    try {
      this.todayReminders.set(await this.api.get<Reminder[]>(`/reminders/patient/${id}/today`));
    } catch (e) {
      this.todayError.set((e as Error).message);
    } finally {
      this.todayLoading.set(false);
    }
  }

  private async loadIntakeHistory(): Promise<void> {
    const id = this.intakePatientId();
    if (!id) return;
    this.historyLoading.set(true);
    this.historyError.set('');
    try {
      this.historyLogs.set(await this.api.get<Reminder[]>(`/reminders/patient/${id}/history`));
    } catch (e) {
      this.historyError.set((e as Error).message);
    } finally {
      this.historyLoading.set(false);
    }
  }

  medOf(r: Reminder) {
    return typeof r.prescriptionId === 'object' ? r.prescriptionId?.medicationId : undefined;
  }

  isOverdue(r: Reminder): boolean {
    if (r.completed_today) return false;
    const now = new Date();
    const [h, m] = (r.reminder_time || '00:00').split(':').map(Number);
    return h * 60 + m < now.getHours() * 60 + now.getMinutes();
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
