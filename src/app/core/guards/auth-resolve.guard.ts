import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserType } from '../models/user.model';

/**
 * Loads the current user (real session, or the old mock-fallback) before
 * the route activates, using `data: { role }` from the route config.
 * Doesn't redirect on failure — same no-redirect behaviour as the
 * original `requireAuth()` in shared.js.
 */
export const authResolveGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const role = (route.data['role'] as UserType) || 'patient';
  await auth.fetchUser(role);
  return true;
};
