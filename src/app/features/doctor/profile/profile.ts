import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { DoctorProfile } from '../../../core/models/doctor-profile.model';

@Component({
  selector: 'app-doctor-profile',
  imports: [FormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  doctorProfile = signal<DoctorProfile | null>(null);

  editing = signal(false);
  form = { name: '', email: '', specialisation: '', license: '', institution: '' };

  successMessage = signal('');
  errorMessage = signal('');

  async ngOnInit(): Promise<void> {
    try {
      this.doctorProfile.set(await this.api.get<DoctorProfile>('/auth/me/doctor'));
    } catch {
      this.doctorProfile.set(null);
    }
  }

  showEdit(): void {
    const u = this.auth.user();
    const dp = this.doctorProfile();
    this.form = {
      name: u?.name ?? '',
      email: u?.email ?? '',
      specialisation: dp?.specialisation ?? '',
      license: dp?.license_num ?? '',
      institution: dp?.institution ?? '',
    };
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  async saveProfile(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');
    try {
      // Note: matches original behaviour — only name/email are persisted to
      // the backend here. Specialisation/license/institution update the
      // local view only (the API has no doctor-profile PATCH route yet).
      await this.api.patch('/patients/profile', { name: this.form.name, email: this.form.email });
      const u = this.auth.user();
      if (u) this.auth.user.set({ ...u, name: this.form.name, email: this.form.email });
      const dp = this.doctorProfile();
      if (dp) {
        this.doctorProfile.set({
          ...dp,
          specialisation: this.form.specialisation,
          license_num: this.form.license,
          institution: this.form.institution,
        });
      }
      this.editing.set(false);
      this.successMessage.set('Profile updated successfully.');
    } catch (e) {
      this.errorMessage.set((e as Error).message);
    }
  }
}
