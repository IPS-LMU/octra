import { ApplicationRef, EventEmitter, inject, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { interval } from 'rxjs';

export class VersionCheckerOptions {
  interval = 5000;

  constructor(partial?: Partial<VersionCheckerOptions>) {
    if (partial) Object.assign(this, partial);
  }
}

@Injectable()
export class VersionCheckerService extends SubscriberComponent {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);

  isNewVersionAvailable = false;
  private options = new VersionCheckerOptions();
  newVersion = new EventEmitter<void>();

  init(options?: VersionCheckerOptions) {
    this.options = options ? new VersionCheckerOptions(options) : this.options;
    this.checkForUpdate();
  }

  /**
   * Hash of the service worker manifest the currently running code was loaded with. Only set if the app shell
   * (index.html) is not cached by the service worker. In this case the page is always loaded from the network,
   * so after a reload the newest version is already running although the service worker may still report it as
   * "VERSION_READY".
   */
  private runningVersionHash?: Promise<string | undefined>;

  checkForUpdate(): void {
    this.subscriptionManager.destroy();
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.runningVersionHash ??= this.getRunningVersionHash();

    this.swUpdate.checkForUpdate();

    // check for updates every 5 minutes
    this.subscribe(interval(this.options.interval), {
      next: () => {
        this.swUpdate.checkForUpdate();
      },
    });

    this.subscribe(this.swUpdate.versionUpdates, {
      next: (evt) => {
        switch (evt.type) {
          case 'VERSION_DETECTED':
            console.log(`Downloading new app version: ${evt.version.hash}`);
            break;
          case 'VERSION_READY':
            console.log(`Current app version: ${evt.currentVersion.hash}`);
            console.log(`New app version ready for use: ${evt.latestVersion.hash}`);
            this.onVersionReady(evt.latestVersion.hash);
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
            break;
        }
      },
    });
  }

  private async onVersionReady(latestHash: string) {
    const runningHash = await this.runningVersionHash;
    if (runningHash && runningHash === latestHash) {
      // the new version was already loaded from the network (e.g. after a page reload) => no notification needed.
      console.log(`App version ${latestHash} is already running.`);
      try {
        await this.swUpdate.activateUpdate();
      } catch (e) {
        console.error(e);
      }
      return;
    }

    this.isNewVersionAvailable = true;
    this.newVersion.emit();
    this.appRef.tick();
  }

  /**
   * Retrieves the hash of the current service worker manifest if the app shell isn't cached by the service worker.
   * The hash is calculated the same way the Angular service worker does it.
   */
  private async getRunningVersionHash(): Promise<string | undefined> {
    try {
      const url = new URL('ngsw.json', document.baseURI);
      url.searchParams.set('ngsw-cache-bust', Math.random().toString());
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) {
        return undefined;
      }
      const manifest = await response.json();
      if (manifest?.hashTable && manifest.index && manifest.hashTable[manifest.index]) {
        // app shell is served from the service worker cache => VERSION_READY is always legit.
        return undefined;
      }

      const json = JSON.stringify(manifest);
      // same byte conversion as the Angular service worker (char codes truncated to 8 bit)
      const bytes = new Uint8Array(json.length);
      for (let i = 0; i < json.length; i++) {
        bytes[i] = json.charCodeAt(i) & 255;
      }
      const digest = await crypto.subtle.digest('SHA-1', bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  applyUpdate() {
    // Reload the page to update to the latest version after the new version is activated
    document.location.reload();
  }

  destroy() {
    this.subscriptionManager.destroy();
  }
}
