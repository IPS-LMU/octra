import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { environment } from '../environments/environment';
import { AppInfo } from './app.info';
import { NavigationComponent } from './core/component';
import { ASRLanguage } from './core/obj';
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
export class AppComponent extends DefaultComponent implements OnInit {
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
    this.transloco.setActiveLang('en');

    const queryParams = {
      audio: this.getParameterByName('audio'),
      host: this.getParameterByName('host'),
      transcript: this.getParameterByName('transcript'),
      embedded: this.getParameterByName('embedded'),
    };

    this.subscrManager.add(
      this.store
        .select(fromApplication.selectIDBLoaded as any)
        .subscribe(() => {
          if (
            this.appStorage.asrSelectedService !== undefined &&
            this.appStorage.asrSelectedLanguage !== undefined
          ) {
            // set asr settings
            const selectedLanguage = this.appStorage.asrSelectedLanguage;
            const selectedService = this.appStorage.asrSelectedService;
            const lang: ASRLanguage = this.asrService.getLanguageByCode(
              selectedLanguage,
              selectedService
            );

            if (lang !== undefined) {
              this.asrService.selectedLanguage = lang;
            } else {
              console.error('Could not read ASR language from database');
            }

            if (!this.settingsService.responsive.enabled) {
              this.setFixedWidth();
            }

            this.navigation?.changeSecondsPerLine(
              this.appStorage.secondsPerLine
            );
          }

          this.bugService.addEntriesFromDB(this.appStorage.consoleEntries);
        })
    );

    // after project settings loaded

    this.settingsService
      .loadApplicationSettings(queryParams)
      .then(() => {
        console.log(`Application settings loaded`);

        this.langService.setAvailableLangs(
          this.settingsService.appSettings.octra.languages
        );

        if (
          this.settingsService.appSettings.octra.tracking !== undefined &&
          this.settingsService.appSettings.octra.tracking.active !==
            undefined &&
          this.settingsService.appSettings.octra.tracking.active !== ''
        ) {
          this.appendTrackingCode(
            this.settingsService.appSettings.octra.tracking.active
          );
        }
      })
      .catch((error) => {
        console.error(error);
      });

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

  test(id: string) {
    this.api
      .fetchAnnotation(Number(id))
      .then((json) => {
        console.log(json);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  reset(id: string) {
    this.api
      .closeSession('julian_test', Number(id), '')
      .then((json) => {
        console.log(json);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  queryParamsSet(): boolean {
    const params = this.route.snapshot.queryParams;
    return params.audio && params.embedded;
  }

  private getParameterByName(name: string, url?: string) {
    if (!url) {
      url = document.location.href;
    }
    name = name.replace(/[[]]/g, '\\$&');
    const regExp = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regExp.exec(url);
    if (!results) {
      return undefined;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  private setFixedWidth() {
    // set fixed width
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerText =
      '.container {width:' + this.settingsService.responsive.fixedwidth + 'px}';
    head.appendChild(style);
  }

  private appendTrackingCode(type: string) {
    // check if matomo is activated
    if (type === 'matomo') {
      if (
        this.settingsService.appSettings.octra.tracking.matomo !== undefined &&
        this.settingsService.appSettings.octra.tracking.matomo.host !==
          undefined &&
        this.settingsService.appSettings.octra.tracking.matomo.siteID !==
          undefined
      ) {
        const matomoSettings =
          this.settingsService.appSettings.octra.tracking.matomo;

        const trackingCode = document.createElement('script');
        trackingCode.setAttribute('type', 'text/javascript');
        trackingCode.innerHTML = `
<!-- Matomo -->
<script type="text/javascript">
  var _paq = window._paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="${matomoSettings.host}";
    _paq.push(['setTrackerUrl', u+'piwik.php']);
    _paq.push(['setSiteId', '${matomoSettings.siteID}']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
<!-- End Matomo Code -->`;

        document.body.appendChild(trackingCode);
      } else {
        console.error(
          `attributes for piwik tracking in appconfig.json are invalid.`
        );
      }
    } else {
      console.error(`tracking type ${type} is not supported.`);
    }
  }
}
