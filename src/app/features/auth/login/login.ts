import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  phone = '';
  password = '';

  loading = signal(false);
  alertMessage = signal('');
  phoneError = signal('');
  passwordError = signal('');

  async submit(): Promise<void> {
    this.phoneError.set('');
    this.passwordError.set('');
    this.alertMessage.set('');

    if (!this.phone.trim()) {
      this.phoneError.set('Please enter your phone number.');
      return;
    }
    if (!this.password) {
      this.passwordError.set('Please enter your password.');
      return;
    }

    this.loading.set(true);
    try {
      const user = await this.auth.login(this.phone.trim(), this.password);
      this.router.navigateByUrl(user.user_type === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (e) {
      const msg = (e as Error).message || '';
      if (msg.includes('WRONG_PHONE') || msg.includes('phone number')) {
        this.phoneError.set('No account found with that phone number.');
      } else if (msg.includes('WRONG_PASSWORD') || msg.includes('password') || msg.includes('Incorrect')) {
        this.passwordError.set('Wrong password. Please try again.');
      } else if (msg.includes('required')) {
        this.alertMessage.set('Please fill in all fields.');
      } else {
        this.alertMessage.set('Something went wrong. Please try again.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  clearPhoneError(): void {
    this.phoneError.set('');
  }

  clearPasswordError(): void {
    this.passwordError.set('');
  }
}
