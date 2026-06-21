import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environment';

/**
 * Thin wrapper around HttpClient that mirrors the old shared.js `apiFetch`
 * helper: same base URL, same JSON body handling, same "throw on !ok with
 * server message" behaviour — so the rest of the migration reads almost
 * identically to the vanilla-JS version.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.base + path)).catch(rethrow);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(this.base + path, body ?? {})).catch(rethrow);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.put<T>(this.base + path, body ?? {})).catch(rethrow);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.patch<T>(this.base + path, body ?? {})).catch(rethrow);
  }

  delete<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(this.base + path)).catch(rethrow);
  }
}

function rethrow(err: HttpErrorResponse): never {
  const message = err.error?.message || err.message || 'Request failed';
  throw new Error(message);
}
