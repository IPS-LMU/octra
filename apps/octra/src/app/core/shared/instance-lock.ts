/**
 * Ensures that only one OCTRA instance (tab or window) per browser is active at the same time.
 * All instances share the same IndexedDB. Multiple active instances overwrite each other's session
 * data (e.g. logs of one task end up in another task).
 *
 * Uses the Web Locks API: the lock is held as long as the tab lives and is released automatically
 * by the browser if the tab is closed, reloaded or crashes.
 */
const LOCK_NAME = 'octra_instance';

// keeps the lock until the tab is closed or another tab steals it
const holdForever = () => new Promise<void>(() => {});

function isWebLocksSupported() {
  return typeof navigator !== 'undefined' && navigator.locks !== undefined;
}

function onRequestError(onLost: () => void) {
  return (e: any) => {
    if (e?.name === 'AbortError') {
      // another tab took over the lock
      onLost();
    } else {
      console.error(e);
    }
  };
}

/**
 * tries to acquire the instance lock.
 * @param onLost called if another tab takes over the lock later.
 * @returns true if this tab may run OCTRA, false if another tab is already active.
 */
export function acquireInstanceLock(onLost: () => void): Promise<boolean> {
  if (!isWebLocksSupported()) {
    // old browser: don't block usage
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    navigator.locks
      .request(LOCK_NAME, { ifAvailable: true }, (lock) => {
        if (!lock) {
          resolve(false);
          return undefined;
        }
        resolve(true);
        return holdForever();
      })
      .catch((e) => {
        onRequestError(onLost)(e);
        // in case the request failed before the callback was called
        resolve(true);
      });
  });
}

/**
 * takes over the instance lock from another tab. The other tab is notified via its onLost callback.
 * @param onLost called if another tab takes over the lock later.
 */
export function stealInstanceLock(onLost: () => void): Promise<void> {
  if (!isWebLocksSupported()) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    navigator.locks
      .request(LOCK_NAME, { steal: true }, () => {
        resolve();
        return holdForever();
      })
      .catch((e) => {
        onRequestError(onLost)(e);
        resolve();
      });
  });
}
