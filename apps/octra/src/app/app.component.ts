import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MultiThreadingService, OctraComponentsModule, VersionCheckerService, VersionNotificationComponent } from '@octra/ngx-components';
import { environment } from '../environments/environment';
import { AlertComponent, NavigationComponent } from './core/component';
import { DefaultComponent } from './core/component/default.component';
import { OctraModalComponent } from './core/modals/octra-modal';
import { acquireInstanceLock, stealInstanceLock } from './core/shared/instance-lock';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { LoginMode } from './core/store';
import { ApplicationStoreService } from './core/store/application/application-store.service';
import { AnnotationStoreService } from './core/store/login-mode/annotation/annotation.store.service';

@Component({
  selector: 'octra-app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    AlertComponent,
    OctraModalComponent,
    RouterOutlet,
    OctraComponentsModule,
    NavigationComponent,
    VersionNotificationComponent,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent extends DefaultComponent implements OnInit, OnDestroy {
  appStorage = inject(AppStorageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private multiThreading = inject(MultiThreadingService);
  private appStoreService = inject(ApplicationStoreService);
  private annotationStoreService = inject(AnnotationStoreService);
  protected versionChecker = inject(VersionCheckerService);
  protected cd = inject(ChangeDetectorRef);

  @ViewChild('navigation', { static: true }) navigation: NavigationComponent | undefined;

  public get environment(): any {
    return environment;
  }

  constructor() {
    super();

    if (AppComponent.isAuthSuccessPopup()) {
      // This window is only the re-authentication popup. Do NOT initialize OCTRA here,
      // otherwise a second instance would load the shared IndexedDB session (task, logs, …)
      // and start annotating in parallel to the main window.
      return;
    }

    if (AppComponent.isURLMode()) {
      // URL mode (e.g. embedded in other applications) may run in parallel to other instances
      this.startApplication();
    } else {
      acquireInstanceLock(this.onInstanceLockLost)
        .then((acquired) => {
          if (acquired) {
            this.startApplication();
          } else {
            // another tab or window is already running OCTRA => do not initialize to prevent shared IDB conflicts
            this.instanceBlocked.set(true);
          }
        })
        .catch((e) => {
          console.error(e);
          this.startApplication();
        });
    }

    if (environment.debugging.enabled && environment.debugging.logging.routes) {
      this.subscribe(this.router.events, {
        next: (event: any) => {
          if (event.snapshot) {
            console.log(`route from ${event.url} to guard: ${event.snapshot.url}, component: ${event.snapshot.component?.name}`);
          }
        },
      });
    }

    this.subscribe(this.versionChecker.newVersion, {
      next: () => {
        this.cd.markForCheck();
      },
    });
  }

  ngOnInit() {
    if (AppComponent.isAuthSuccessPopup()) {
      return;
    }
    this.subscribe(this.route.fragment, {
      next: (fragment) => {
        switch (fragment) {
          case 'feedback':
            this.navigation?.openBugReport();
            this.cd.markForCheck();
            break;
        }
      },
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.multiThreading.destroy();
    this.annotationStoreService.destroy();
    this.appStoreService.destroy();
    this.versionChecker.destroy();
  }

  protected readonly LoginMode = LoginMode;

  /**
   * true if OCTRA is already active in another tab or window.
   */
  protected instanceBlocked = signal(false);
  protected readonly blockedTexts = AppComponent.getBlockedTexts();

  private applicationStarted = false;

  private startApplication() {
    if (this.applicationStarted) {
      return;
    }
    this.applicationStarted = true;
    this.appStoreService.initApplication();
    this.versionChecker.init({
      interval: 5 * 60 * 1000, // check every 5 minutes
    });
  }

  private onInstanceLockLost = () => {
    // another tab took over. Reload so that this tab stops working with the shared session
    // and shows the blocked notice after reload.
    window.location.reload();
  };

  /**
   * continues working in this tab. The other tab gets notified and stops.
   */
  protected useThisTab() {
    stealInstanceLock(this.onInstanceLockLost)
      .then(() => {
        this.instanceBlocked.set(false);
        this.startApplication();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  static isURLMode(): boolean {
    return new URLSearchParams(window.location.search).has('audio_url');
  }

  /**
   * translations are not loaded if OCTRA is not initialized, so use static texts.
   */
  private static getBlockedTexts() {
    const isGerman = (navigator.language ?? '').toLowerCase().startsWith('de');
    return isGerman
      ? {
          title: 'OCTRA ist bereits geöffnet',
          description:
            'OCTRA ist bereits in einem anderen Tab oder Fenster dieses Browsers geöffnet. Um Datenverlust zu vermeiden, kann OCTRA nur in einem Tab gleichzeitig verwendet werden.',
          button: 'Hier weiterarbeiten',
          hint: 'Der andere Tab wird dann gesperrt.',
        }
      : {
          title: 'OCTRA is already open',
          description:
            'OCTRA is already open in another tab or window of this browser. To prevent data loss, OCTRA can only be used in one tab at a time.',
          button: 'Continue here',
          hint: 'The other tab will be locked.',
        };
  }

  /**
   * returns true if the current window is the popup opened for re-authentication (see AuthenticationEffects).
   */
  static isAuthSuccessPopup(): boolean {
    return /\/auth-success\/?$/.test(window.location.pathname);
  }
}
