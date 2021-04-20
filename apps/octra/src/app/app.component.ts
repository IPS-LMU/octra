import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../environments/environment';
import {AppInfo} from './app.info';
import {NavigationComponent} from './core/component/navbar';
import {ASRLanguage} from './core/obj/Settings';
import {isUnset, SubscriptionManager} from '@octra/utilities';
import {MultiThreadingService} from './core/shared/multi-threading/multi-threading.service';
import {APIService, SettingsService} from './core/shared/service';
import {AppStorageService} from './core/shared/service/appstorage.service';
import {AsrService} from './core/shared/service/asr.service';
import {BugReportService, ConsoleType} from './core/shared/service/bug-report.service';
import * as jQuery from 'jquery';
import * as fromApplication from './core/store/application'
import * as fromTranscription from './core/store/transcription'
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';

@Component({
  selector: 'octra-app',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnDestroy, OnInit, AfterViewInit {

  @ViewChild('navigation', {static: true}) navigation: NavigationComponent;
  private subscrmanager: SubscriptionManager<Subscription> = new SubscriptionManager<Subscription>();

  public get version(): string {
    return AppInfo.version;
  }

  public get environment(): any {
    return environment;
  }

  constructor(private api: APIService,
              private langService: TranslocoService,
              public appStorage: AppStorageService,
              private settingsService: SettingsService,
              private bugService: BugReportService,
              private router: Router,
              private route: ActivatedRoute,
              private multiThreading: MultiThreadingService,
              private asrService: AsrService,
              private store: Store) {

    this.router.events.subscribe((event: any) => {
        if (event.hasOwnProperty('url')) {
          console.log(`route to page: ${event?.url}`);
        } else if (event.hasOwnProperty('snapshot')) {
          console.log(`route to guard: ${event.snapshot.url}, component: ${event.snapshot.component?.name}`);
        }
      }
    );

    // overwrite console.log
    if (!AppInfo.debugging) {
      const oldLog = console.log;
      const serv = this.bugService;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.log = function (message) {
          serv.addEntry(ConsoleType.LOG, message);
          oldLog.apply(console, arguments);
        };
      })();

      // overwrite console.err
      const oldError = console.error;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.error = function (error, context) {
          let debug = '';
          let stack = '';

          if (typeof error === 'string') {
            debug = error;

            if (error === 'ERROR' && !isUnset(context) && context.hasOwnProperty('stack') && context.hasOwnProperty('message')) {
              debug = context.message;
              stack = context.stack;
            }
          } else {
            if (error instanceof Error) {
              debug = error.message;
              stack = error.stack;
            } else {
              if (typeof error === 'object') {
                // some other type of object
                debug = 'OBJECT';
                stack = JSON.stringify(error);
              } else {
                debug = error;
              }
            }
          }

          if (debug !== '') {
            serv.addEntry(ConsoleType.ERROR, `${debug}${(stack !== '') ? ' ' + stack : ''}`);
          }

          oldError.apply(console, arguments);
        };
      })();

      // overwrite console.warn
      const oldWarn = console.warn;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.warn = function (message) {
          serv.addEntry(ConsoleType.WARN, message);
          oldWarn.apply(console, arguments);
        };
      })();
    }
  }

  ngOnInit() {
    const queryParams = {
      audio: this.getParameterByName('audio'),
      host: this.getParameterByName('host'),
      transcript: this.getParameterByName('transcript'),
      embedded: this.getParameterByName('embedded')
    };

    this.subscrmanager.add(this.store.select(fromApplication.selectIDBLoaded).subscribe(
      () => {
        if (!isUnset(this.appStorage.asrSelectedService) && !isUnset(this.appStorage.asrSelectedLanguage)) {
          // set asr settings
          const selectedLanguage = this.appStorage.asrSelectedLanguage;
          const selectedService = this.appStorage.asrSelectedService;
          const lang: ASRLanguage = this.asrService.getLanguageByCode(selectedLanguage, selectedService);

          if (!isUnset(lang)) {
            this.asrService.selectedLanguage = lang;
          } else {
            console.error('Could not read ASR language from database');
          }
        }

        this.bugService.addEntriesFromDB(this.appStorage.consoleEntries);
      }
    ));

    // after project settings loaded
    this.subscrmanager.add(this.store.select(fromTranscription.selectProjectConfig).subscribe(
      () => {
        if (!this.settingsService.responsive.enabled) {
          this.setFixedWidth();
        }

        this.navigation.changeSecondsPerLine(this.appStorage.secondsPerLine);
      }
    ));

    this.settingsService.loadApplicationSettings(queryParams).then(() => {
      console.log(`Application settings loaded`);

      this.langService.setAvailableLangs(this.settingsService.appSettings.octra.languages);

      if (!isUnset(this.settingsService.appSettings.octra.tracking)
        && !isUnset(this.settingsService.appSettings.octra.tracking.active)
        && this.settingsService.appSettings.octra.tracking.active !== '') {
        this.appendTrackingCode(this.settingsService.appSettings.octra.tracking.active);
      }

    }).catch((error) => {
      console.error(error);
    });

    this.route.fragment.subscribe((fragment) => {
      switch (fragment) {
        case('feedback'):
          this.navigation.openBugReport();
          break;
      }
    });
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
    this.multiThreading.destroy();
  }

  test(id: string) {
    this.api.fetchAnnotation(Number(id)).then((json) => {
      console.log(json);
    }).catch((error) => {
      console.error(error);
    });
  }

  reset(id: string) {
    this.api.closeSession('julian_test', Number(id), '').then((json) => {
      console.log(json);
    }).catch((error) => {
      console.error(error);
    });
  }

  queryParamsSet(route: ActivatedRoute): boolean {
    const params = this.route.snapshot.queryParams;
    return (
      params.hasOwnProperty('audio') &&
      params.hasOwnProperty('embedded')
    );
  }

  private getParameterByName(name: string, url = null) {
    if (!url) {
      url = document.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    const regExp = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regExp.exec(url);
    if (!results) {
      return null;
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
    style.innerText = '.container {width:' + this.settingsService.responsive.fixedwidth + 'px}';
    head.appendChild(style);
  }

  private appendTrackingCode(type: string) {
    // check if matomo is activated
    if (type === 'matomo') {
      if (!isUnset(this.settingsService.appSettings.octra.tracking.matomo)
        && !isUnset(this.settingsService.appSettings.octra.tracking.matomo.host)
        && !isUnset(this.settingsService.appSettings.octra.tracking.matomo.siteID)) {
        const matomoSettings = this.settingsService.appSettings.octra.tracking.matomo;

        const trackingCode = `
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

        jQuery(trackingCode).insertAfter(jQuery('body').children().last());
      } else {
        console.error(`attributes for piwik tracking in appconfig.json are invalid.`);
      }
    } else {
      console.error(`tracking type ${type} is not supported.`);
    }
  }
}
