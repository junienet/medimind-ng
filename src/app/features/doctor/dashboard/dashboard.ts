import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Patient } from '../../../core/models/patient.model';
import { Prescription } from '../../../core/models/prescription.model';

@Component({
  selector: 'app-doctor-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  statPatients = signal<number | null>(null);
  statPrescriptions = signal<number | null>(null);

  get greeting(): string {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = this.auth.user()?.name?.split(' ')[0] ?? '';
    return `${g}, Dr. ${firstName}.`;
  }

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    try {
      const patients = await this.api.get<Patient[]>('/patients');
      this.statPatients.set(patients.length);
      let total = 0;
      for (const p of patients.slice(0, 5)) {
        try {
          const pr = await this.api.get<Prescription[]>(`/prescriptions/patient/${p._id}`);
          total += pr.filter((r) => r.status === 'active').length;
        } catch {
          // skip patients whose prescriptions fail to load
        }
      }
      this.statPrescriptions.set(total);
    } catch {
      // leave stats as '—'
    }
  }
}
