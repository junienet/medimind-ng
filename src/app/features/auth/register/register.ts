import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { UserType } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private api = inject(ApiService);
  private router = inject(Router);

  role = signal<UserType>('patient');
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  name = '';
  phone = '';
  email = '';
  password = '';
  specialisation = '';
  license = '';
  institution = '';

  selectRole(role: UserType): void {
    this.role.set(role);
  }

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload: Record<string, unknown> = {
      name: this.name.trim(),
      phone_number: this.phone.trim(),
      email: this.email.trim(),
      password: this.password,
      user_type: this.role(),
    };
    if (this.role() === 'doctor') {
      payload['specialisation'] = this.specialisation.trim();
      payload['license_num'] = this.license.trim();
      payload['institution'] = this.institution.trim();
    }
    if (!payload['name'] || !payload['phone_number'] || !payload['password']) {
      this.errorMessage.set('Name, phone number and password are required.');
      return;
    }

    this.loading.set(true);
    try {
      await this.api.post('/auth/register', payload);
      this.successMessage.set('Account created! Redirecting to login…');
      setTimeout(() => this.router.navigateByUrl('/login'), 1500);
    } catch (e) {
      this.errorMessage.set((e as Error).message);
      this.loading.set(false);
    }
  }
}
