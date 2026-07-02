import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MultiThreadingService, OctraComponentsModule, VersionCheckerService, VersionNotificationComponent } from '@octra/ngx-components';
import { environment } from '../environments/environment';
import { AlertComponent, NavigationComponent } from './core/component';
import { DefaultComponent } from './core/component/default.component';
import { OctraModalComponent } from './core/modals/octra-modal';
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
    this.appStoreService.initApplication();
    this.versionChecker.init({
      interval: 5 * 60 * 1000, // check every 5 minutes
    });

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
}
