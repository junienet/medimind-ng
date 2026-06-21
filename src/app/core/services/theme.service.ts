import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'mm_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  constructor() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    this.apply(saved === 'dark', false);
  }

  toggle(): void {
    this.apply(!this.isDark(), true);
  }

  private apply(dark: boolean, save: boolean): void {
    this.isDark.set(dark);
    document.documentElement.classList.toggle('dark', dark);
    if (save) localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }
}
