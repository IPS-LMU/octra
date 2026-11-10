import { isDevMode } from '@angular/core';

/**
 * true if the Angular Service Worker is registered (see provideServiceWorker in app.config.ts).
 * Must use the same condition, otherwise requests are intercepted although they should bypass it.
 */
export function isServiceWorkerEnabled(): boolean {
  return !isDevMode();
}

/**
 * returns the "ngsw-bypass" header/query param if the service worker is enabled.
 *
 * Requests to Shibboleth-protected services must bypass the service worker: if the session expired,
 * the redirect to the IdP fails due to CORS. Without bypass the service worker converts this network error
 * into a "504 Gateway Timeout" response, so OCTRA can't detect that re-authentication is needed
 * (expects "0 Unknown Error").
 */
export function ngswBypass(): Record<string, string> {
  return isServiceWorkerEnabled() ? { 'ngsw-bypass': 'true' } : {};
}
