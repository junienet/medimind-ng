import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, UserType } from '../models/user.model';

const TOKEN_KEY = 'mm_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  /** Current signed-in user (or mock placeholder — see fetchUser()). */
  readonly user = signal<User | null>(null);
  readonly isDoctor = computed(() => this.user()?.user_type === 'doctor');
  readonly isPatient = computed(() => this.user()?.user_type === 'patient');

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async login(phone_number: string, password: string): Promise<User> {
    const data = await this.api.post<{ token: string; user: User }>('/auth/login', {
      phone_number,
      password,
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    this.user.set(data.user);
    return data.user;
  }

  /**
   * Mirrors the old `requireAuth(role)`: tries the real session first, and
   * falls back to a mock user (instead of redirecting) so pages still
   * render — handy for demos/screenshots. Call this once per page load.
   */
  async fetchUser(fallbackRole: UserType = 'patient'): Promise<User> {
    if (this.token) {
      try {
        const { user } = await this.api.get<{ user: User }>('/auth/me');
        this.user.set(user);
        return user;
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    const mock: User = {
      name: fallbackRole === 'doctor' ? 'Dr. Sample User' : 'Sample Patient',
      phone_number: '+60123456789',
      email: 'sample@medimind.com',
      user_type: fallbackRole,
    };
    this.user.set(mock);
    return mock;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }
}
