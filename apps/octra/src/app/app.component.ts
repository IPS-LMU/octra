import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { environment } from '../environments/environment';
import { AppInfo } from './app.info';
import { NavigationComponent } from './core/component';
import { MultiThreadingService } from './core/shared/multi-threading/multi-threading.service';
import { APIService, SettingsService } from './core/shared/service';
import { AppStorageService } from './core/shared/service/appstorage.service';
import { AsrService } from './core/shared/service/asr.service';
import { BugReportService } from './core/shared/service/bug-report.service';
import * as fromApplication from './core/store/application';
import { Store } from '@ngrx/store';
import { DefaultComponent } from './core/component/default.component';
import { ApplicationStoreService } from './core/store/application/application-store.service';

@Component({
  selector: 'octra-app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent
  extends DefaultComponent
  implements OnInit, OnDestroy
{
  @ViewChild('navigation', { static: true }) navigation:
    | NavigationComponent
    | undefined;

  public get version(): string {
    return AppInfo.version;
  }

  public get environment(): any {
    return environment;
  }

  constructor(
    private api: APIService,
    private langService: TranslocoService,
    public appStorage: AppStorageService,
    private settingsService: SettingsService,
    private bugService: BugReportService,
    private router: Router,
    private route: ActivatedRoute,
    private multiThreading: MultiThreadingService,
    private asrService: AsrService,
    private appStoreService: ApplicationStoreService,
    private store: Store,
    private transloco: TranslocoService
  ) {
    super();

    this.appStoreService.initApplication();

    this.router.events.subscribe((event: any) => {
      if (event.url) {
        console.log(`route to page: ${event?.url}`);
      } else if (event.snapshot) {
        console.log(
          `route to guard: ${event.snapshot.url}, component: ${event.snapshot.component?.name}`
        );
      }
    });
  }

  ngOnInit() {
    this.subscrManager.add(
      this.store
        .select(fromApplication.selectIDBLoaded as any)
        .subscribe(() => {
          if (
            this.appStorage.asrSelectedService !== undefined &&
            this.appStorage.asrSelectedLanguage !== undefined
          ) {
            this.navigation?.changeSecondsPerLine(
              this.appStorage.secondsPerLine
            );
          }
        })
    );

    this.route.fragment.subscribe((fragment) => {
      switch (fragment) {
        case 'feedback':
          this.navigation?.openBugReport();
          break;
      }
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.multiThreading.destroy();
  }

  queryParamsSet(): boolean {
    const params = this.route.snapshot.queryParams;
    return params.audio && params.embedded;
  }
}
