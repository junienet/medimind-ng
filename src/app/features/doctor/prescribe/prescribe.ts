import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Patient } from '../../../core/models/patient.model';
import { Medication } from '../../../core/models/medication.model';

@Component({
  selector: 'app-doctor-prescribe',
  imports: [FormsModule],
  templateUrl: './prescribe.html',
})
export class Prescribe implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  patients = signal<Patient[]>([]);
  medications = signal<Medication[]>([]);
  times = signal<string[]>([]);

  selectedPatientId = '';
  selectedMedId = '';
  startDate = '';
  endDate = '';
  notes = '';
  newTime = '';

  errorMessage = signal('');
  successMessage = signal('');

  async ngOnInit(): Promise<void> {
    const preselect = this.route.snapshot.queryParamMap.get('patientId');
    try {
      const [patients, meds] = await Promise.all([
        this.api.get<Patient[]>('/patients'),
        this.api.get<Medication[]>('/medications'),
      ]);
      this.patients.set(patients);
      this.medications.set(meds);
      if (preselect) this.selectedPatientId = preselect;
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    }
  }

  formatTime(t: string): string {
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  }

  addTime(): void {
    if (!this.newTime || this.times().includes(this.newTime)) return;
    this.times.update((t) => [...t, this.newTime]);
    this.newTime = '';
  }

  removeTime(t: string): void {
    this.times.update((arr) => arr.filter((x) => x !== t));
  }

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');
    const body = {
      patientId: this.selectedPatientId,
      medicationId: this.selectedMedId,
      start_date: this.startDate,
      end_date: this.endDate,
      notes: this.notes,
      reminder_times: this.times(),
    };
    if (!body.patientId || !body.medicationId || !body.start_date || !body.end_date) {
      this.errorMessage.set('Patient, medication, start and end date are required.');
      return;
    }
    try {
      await this.api.post('/prescriptions', body);
      this.successMessage.set('Prescription created successfully!');
      this.notes = '';
      this.times.set([]);
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    }
  }
}
