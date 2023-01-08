import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {APIService, AppStorageService, SettingsService} from './core/shared/service';
import {SubscriptionManager} from './core/obj/SubscriptionManager';
import {BugReportService, ConsoleType} from './core/shared/service/bug-report.service';
import {AppInfo} from './app.info';
import {environment} from '../environments/environment';
import {ActivatedRoute, Router} from '@angular/router';
import {NavigationComponent} from './core/gui/navbar';
import {isNullOrUndefined} from './core/shared/Functions';
import {MultiThreadingService} from './core/shared/multi-threading/multi-threading.service';
import {AsrService} from './core/shared/service/asr.service';
import {ASRLanguage} from './core/obj/Settings';
import {TranslocoService} from '@ngneat/transloco';

@Component({
  selector: 'app-octra',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnDestroy, OnInit, AfterViewInit {

  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  @ViewChild('navigation', {static: true}) navigation: NavigationComponent;

  public get version(): string {
    return AppInfo.version;
  }

  public get environment(): any {
    return environment;
  }

  public get isLoggedIn() {
    return this.loggedIn;
  }

  private loggedIn = false;

  constructor(private api: APIService,
              private langService: TranslocoService,
              public appStorage: AppStorageService,
              private settingsService: SettingsService,
              private bugService: BugReportService,
              private router: Router,
              private route: ActivatedRoute,
              private multiThreading: MultiThreadingService,
              private asrService: AsrService) {
    // overwrite console.log
    if (!AppInfo.debugging) {
      const oldLog = console.log;
      const serv = this.bugService;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.log = function(message: any, addToProtocol = true) {
          if (addToProtocol) {
            serv.addEntry(ConsoleType.LOG, message);
          }
          oldLog.apply(console, arguments);
        };
      })();

      // overwrite console.err
      const oldError = console.error;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.error = function(error, context, addToProtocol = true) {
          if (addToProtocol) {
            let debug = '';
            let stack = '';

            if (typeof error === 'string') {
              debug = error;

              if (error === 'ERROR' && !isNullOrUndefined(context) && context.hasOwnProperty('stack') && context.hasOwnProperty('message')) {
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
          }

          oldError.apply(console, arguments);
        };
      })();

      // overwrite console.warn
      const oldWarn = console.warn;
      (() => {
        // tslint:disable-next-line:only-arrow-functions
        console.warn = function(message, addToProtocol = true) {
          if (addToProtocol) {
            serv.addEntry(ConsoleType.WARN, message);
          }
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

    this.subscrmanager.add(this.settingsService.dbloaded.subscribe(
      () => {
        if (!isNullOrUndefined(this.appStorage.asrSelectedService) && !isNullOrUndefined(this.appStorage.asrSelectedLanguage)) {
          // set asr settings
          const lang: ASRLanguage = this.asrService.getLanguageByCode(this.appStorage.asrSelectedLanguage, this.appStorage.asrSelectedService);
          if (!isNullOrUndefined(lang)) {
            this.asrService.selectedLanguage = lang;
          } else {
            console.error('Could not read ASR language from database');
          }
        }

        if (!isNullOrUndefined(this.appStorage.mausSelectedLanguage) && !isNullOrUndefined(this.appStorage.mausSelectedLanguage)) {
          // set asr settings
          this.asrService.selectedMAUSLanguage = {
            language: this.appStorage.mausSelectedLanguage.language,
            code: this.appStorage.mausSelectedLanguage.code
          };
        }

        this.appStorage.loadConsoleEntries().then((dbEntry: any) => {
          if (!isNullOrUndefined(dbEntry) && dbEntry.hasOwnProperty('value')) {
            this.bugService.addEntriesFromDB(dbEntry.value);
          } else {
            this.bugService.addEntriesFromDB(null);
          }
        }).catch((error) => {
          console.error(error);
        });
      }
    ));

    // after project settings loaded
    this.subscrmanager.add(this.settingsService.projectsettingsloaded.subscribe(
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

      if (!isNullOrUndefined(this.settingsService.appSettings.octra.tracking)
        && !isNullOrUndefined(this.settingsService.appSettings.octra.tracking.active)
        && this.settingsService.appSettings.octra.tracking.active !== '') {
        this.appendTrackingCode(this.settingsService.appSettings.octra.tracking.active);
      }


      this.settingsService.updateASRInfo(this.settingsService.appSettings).then((result) => {
        console.log(`LOADED and updated!`);
      }).catch((error) => {
        console.error(error);
      });


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

    this.subscrmanager.add(this.appStorage.loginActivityChanged.subscribe(
      (a) => {
        this.loggedIn = a;
      }
    ));
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

  private getParameterByName(name, url = null) {
    if (!url) {
      url = document.location.href;
    }
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  queryParamsSet(route: ActivatedRoute): boolean {
    const params = this.route.snapshot.queryParams;
    return (
      params.hasOwnProperty('audio') &&
      params.hasOwnProperty('embedded')
    );
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
      if (!isNullOrUndefined(this.settingsService.appSettings.octra.tracking.matomo)
        && !isNullOrUndefined(this.settingsService.appSettings.octra.tracking.matomo.host)
        && !isNullOrUndefined(this.settingsService.appSettings.octra.tracking.matomo.siteID)) {
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
