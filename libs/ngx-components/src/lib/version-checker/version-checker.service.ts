import { ApplicationRef, Injectable } from '@angular/core';
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
  isNewVersionAvailable = false;
  private options = new VersionCheckerOptions();

  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef,
  ) {
    super();
  }

  init(options?: VersionCheckerOptions) {
    this.options = options ? new VersionCheckerOptions(options) : this.options;
    this.checkForUpdate();
  }

  checkForUpdate(): void {
    this.subscriptionManager.destroy();
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.checkForUpdate().then(() => {
      console.log('Checking for updates...');
    });

    // check for updates every 5 minutes
    this.subscribe(interval(this.options.interval), {
      next: () => {
        this.swUpdate.checkForUpdate().then(() => {
          console.log('Checking for updates...');
        });
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
            console.log(
              `New app version ready for use: ${evt.latestVersion.hash}`,
            );
            this.isNewVersionAvailable = true;
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.log(
              `Failed to install app version '${evt.version.hash}': ${evt.error}`,
            );
            break;
        }
      },
    });
  }

  applyUpdate() {
    // Reload the page to update to the latest version after the new version is activated
    document.location.reload();
  }
}
