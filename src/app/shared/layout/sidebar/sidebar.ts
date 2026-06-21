import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { UserType } from '../../../core/models/user.model';

interface NavItem {
  label: string;
  path: string;
  icon: string; // inner SVG path content
}

const PATIENT_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { label: 'My Medications', path: '/patient/medications', icon: '<path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6z"/><path d="M9 3v6h6"/><path d="M12 11v6M9 14h6"/>' },
  { label: 'History', path: '/patient/history', icon: '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>' },
  { label: 'Profile', path: '/patient/profile', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>' },
];

const DOCTOR_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/doctor/dashboard', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { label: 'My Patients', path: '/doctor/patients', icon: '<circle cx="9" cy="7" r="4"/><path d="M1 21v-1a8 8 0 0116 0v1"/><path d="M16 3.13a4 4 0 010 7.75M22 21v-1a4 4 0 00-3-3.85"/>' },
  { label: 'Prescribe', path: '/doctor/prescribe', icon: '<path d="M9 12h6M12 9v6M4 6h16M4 18h16"/>' },
  { label: 'Medications', path: '/doctor/medications', icon: '<path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>' },
  { label: 'Profile', path: '/doctor/profile', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>' },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  @Input() role: UserType = 'patient';
  @Input() open = false;
  @Output() closeMobile = new EventEmitter<void>();

  auth = inject(AuthService);
  theme = inject(ThemeService);

  get navItems(): NavItem[] {
    return this.role === 'doctor' ? DOCTOR_NAV : PATIENT_NAV;
  }

  get initials(): string {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  logout(): void {
    this.auth.logout();
  }
}
